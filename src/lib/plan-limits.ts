// Plan-based daily AI limits. Pure logic: no Supabase imports, easy to test.
import { DAILY_FREE_LIMIT } from "./rate-limit";

export type Plan = "free" | "pro" | "team";

export const PLAN_LIMITS: Record<Plan, number> = {
  free: DAILY_FREE_LIMIT, // 3
  // Gemini's free tier is a single project-wide daily pool, so per-user
  // allowances stay conservative until paid capacity exists.
  pro: 20,
  team: Number.POSITIVE_INFINITY, // unlimited
};

export function normalizePlan(value: unknown): Plan {
  return value === "pro" || value === "team" ? value : "free";
}

/** Daily AI-call allowance for a plan (shared across all AI tools). */
export function limitForPlan(value: unknown): number {
  return PLAN_LIMITS[normalizePlan(value)];
}
