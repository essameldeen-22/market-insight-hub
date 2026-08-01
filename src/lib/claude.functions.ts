import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AnalysisResult } from "./claude.server";
import { DAILY_FREE_LIMIT, dayKey, isRateLimited, nextUsage, usageForToday } from "./rate-limit";

const AnalyzeInput = z.object({
  productName: z.string().max(200).default(""),
  reviews: z.array(z.string().min(1).max(2000)).min(1).max(200),
});

function hashReviews(productName: string, reviews: string[]): string {
  const normalized =
    productName.trim().toLowerCase() +
    "\n---\n" +
    reviews.map((r) => r.trim()).sort().join("\n");
  return createHash("sha256").update(normalized).digest("hex");
}

export const analyzeReviewsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    const hash = hashReviews(data.productName, data.reviews);

    // 1. Cache lookup — identical (user, product, reviews) → skip Claude.
    const { data: cached } = await context.supabase
      .from("competitor_analyses")
      .select("result, created_at")
      .eq("user_id", uid)
      .eq("reviews_hash", hash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached?.result) {
      const previous = await loadPrevious(context.supabase, uid, data.productName, hash);
      return {
        result: cached.result as unknown as AnalysisResult,
        previous,
        cached: true,
        usage: await currentUsage(context.supabase, uid),
      };
    }

    // 2. Rate limit gate — cache hits don't cost anything, but a real call does.
    const usage = await currentUsage(context.supabase, uid);
    if (isRateLimited(usage.count, DAILY_FREE_LIMIT)) {
      throw new Error("RATE_LIMIT_DAILY");
    }

    // 3. Real analysis.
    const { analyzeReviews } = await import("./claude.server");
    const result = await analyzeReviews(data.productName, data.reviews);

    // 4. Persist + previous lookup (before insert so we don't get "self").
    const previous = await loadPrevious(context.supabase, uid, data.productName, hash);
    try {
      await context.supabase.from("competitor_analyses").insert({
        user_id: uid,
        product_name: data.productName,
        reviews_text: data.reviews.join("\n"),
        result: result as unknown as never,
        reviews_hash: hash,
      });
    } catch (e) {
      console.error("Failed to persist analysis:", e);
    }

    // 5. Bump usage counter.
    const bumped = nextUsage(usage.count);
    await context.supabase
      .from("analysis_usage")
      .upsert(
        { user_id: uid, ...bumped, updated_at: new Date().toISOString() },
        { onConflict: "user_id,day" },
      );

    return {
      result,
      previous,
      cached: false,
      usage: { count: usage.count + 1, limit: DAILY_FREE_LIMIT },
    };
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function currentUsage(supabase: any, uid: string) {
  const today = dayKey();
  const { data } = await supabase
    .from("analysis_usage")
    .select("count, day")
    .eq("user_id", uid)
    .eq("day", today)
    .maybeSingle();
  return { count: usageForToday(data, today), limit: DAILY_FREE_LIMIT };
}

async function loadPrevious(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  uid: string,
  productName: string,
  currentHash: string,
): Promise<{ result: AnalysisResult; created_at: string } | null> {
  if (!productName) return null;
  const { data } = await supabase
    .from("competitor_analyses")
    .select("result, created_at")
    .eq("user_id", uid)
    .eq("product_name", productName)
    .neq("reviews_hash", currentHash)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.result) return null;
  return { result: data.result as AnalysisResult, created_at: (data.created_at as string) ?? "" };
}
