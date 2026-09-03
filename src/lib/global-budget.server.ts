// Server-only access to the site-wide daily AI counter (`daily_ai_usage`).
// Kept in a .server file so the admin client never reaches the browser bundle.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { dayKey } from "./rate-limit";
import { isGlobalBudgetReached } from "./usage";

/** Throws AI_BUSY when the shared daily pool is nearly exhausted. */
export async function assertGlobalBudget(): Promise<number> {
  const { data } = await supabaseAdmin
    .from("daily_ai_usage")
    .select("count")
    .eq("day", dayKey())
    .maybeSingle();
  const total = Math.max(0, (data?.count as number | undefined) ?? 0);
  if (isGlobalBudgetReached(total)) throw new Error("AI_BUSY");
  return total;
}

/** Bumps the site-wide counter after a billable AI call. */
export async function bumpGlobalUsage(total: number): Promise<void> {
  try {
    await supabaseAdmin
      .from("daily_ai_usage")
      .upsert({ day: dayKey(), count: total + 1, updated_at: new Date().toISOString() }, { onConflict: "day" });
  } catch (e) {
    console.error("Failed to bump global AI usage:", e);
  }
}
