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
