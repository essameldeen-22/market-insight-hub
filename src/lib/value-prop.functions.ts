import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ValuePropResult } from "./value-prop.server";
import { isRateLimited } from "./rate-limit";
import { bumpUsage, currentUsage } from "./usage";

const GenInput = z.object({
  product: z.string().min(1).max(200),
  target: z.string().min(1).max(400),
  pains: z.string().min(1).max(800),
  differentiator: z.string().min(1).max(400),
  lang: z.enum(["ar", "en"]).default("en"),
});

export const generateValuePropFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenInput.parse(input))
  .handler(async ({ data, context }) => {
    // Same daily allowance as the competitor analyser, shared counter.
    const usage = await currentUsage(context.supabase, context.userId);
    if (isRateLimited(usage.count, usage.limit)) {
      throw new Error("RATE_LIMIT_DAILY");
    }

    const { assertGlobalBudget, bumpGlobalUsage } = await import("./global-budget.server");
    const globalTotal = await assertGlobalBudget();

    const { generateValueProp } = await import("./value-prop.server");
    const result = await generateValueProp(data);

    await bumpUsage(context.supabase, context.userId, usage.count);
    await bumpGlobalUsage(globalTotal);

    try {
      await context.supabase.from("value_props").insert({
        user_id: context.userId,
        product: data.product,
        target: data.target,
        pains: data.pains,
        differentiator: data.differentiator,
        result: result as unknown as never,
      });
    } catch (e) {
      console.error("Failed to persist value prop:", e);
    }
    return result;
  });


export interface StoredValueProp {
  id: string;
  product: string;
  target: string;
  pains: string;
  differentiator: string;
  result: ValuePropResult | null;
  created_at: string;
}

export const listValuePropsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("value_props")
      .select("id, product, target, pains, differentiator, result, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return (data ?? []) as StoredValueProp[];
  });
