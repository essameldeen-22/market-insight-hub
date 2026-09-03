// Shared daily-usage helpers for every AI-backed server function.
// Reuses the pure logic in rate-limit.ts + plan-limits.ts; no new limiting logic.
import { dayKey, nextUsage, usageForToday } from "./rate-limit";
import { limitForPlan } from "./plan-limits";

export interface UsageSnapshot {
  count: number;
  limit: number;
  plan: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Reads today's usage row and the caller's plan-based daily limit. */
export async function currentUsage(supabase: any, uid: string): Promise<UsageSnapshot> {
  const today = dayKey();
  const [{ data: usageRow }, { data: profile }] = await Promise.all([
    supabase.from("analysis_usage").select("count, day").eq("user_id", uid).eq("day", today).maybeSingle(),
    supabase.from("profiles").select("plan").eq("id", uid).maybeSingle(),
  ]);
  const plan = (profile?.plan as string) ?? "free";
  return { count: usageForToday(usageRow, today), limit: limitForPlan(plan), plan };
}

/** Bumps today's counter after a billable AI call. */
export async function bumpUsage(supabase: any, uid: string, count: number): Promise<void> {
  const bumped = nextUsage(count);
  await supabase
    .from("analysis_usage")
    .upsert({ user_id: uid, ...bumped, updated_at: new Date().toISOString() }, { onConflict: "user_id,day" });
}

// ---------------------------------------------------------------------------
// Site-wide daily AI budget.
// The Gemini free tier caps requests per project, not per user, so a shared
// counter guards the whole pool. Stored in `daily_ai_usage` (service-role only)
// and read/written with the admin client from server functions.

export const DEFAULT_GLOBAL_DAILY_AI_BUDGET = 200;
export const GLOBAL_BUDGET_THRESHOLD = 0.8;

export function globalBudget(): number {
  const raw = Number(process.env["GLOBAL_DAILY_AI_BUDGET"]);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_GLOBAL_DAILY_AI_BUDGET;
}

/** True once today's site-wide calls cross the safe threshold of the budget. */
export function isGlobalBudgetReached(total: number, budget: number = globalBudget()): boolean {
  return total >= budget * GLOBAL_BUDGET_THRESHOLD;
}
