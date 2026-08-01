// Pure rate-limiting logic for the free tier of AI analyses.
// Kept dependency-free so it can be unit tested without Supabase.

export const DAILY_FREE_LIMIT = 3;

export interface UsageRow {
  count: number;
  day: string;
}

/** UTC day key used as the `day` column of `analysis_usage`. */
export function dayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** A stored row only counts toward today's usage if it is today's row. */
export function usageForToday(row: UsageRow | null | undefined, today: string): number {
  if (!row) return 0;
  if (row.day && row.day !== today) return 0;
  return Math.max(0, row.count ?? 0);
}

export function isRateLimited(count: number, limit: number = DAILY_FREE_LIMIT): boolean {
  return count >= limit;
}

export function remaining(count: number, limit: number = DAILY_FREE_LIMIT): number {
  return Math.max(0, limit - count);
}

/** Next row to upsert into `analysis_usage` after a billable call. */
export function nextUsage(count: number, today: string = dayKey()) {
  return { day: today, count: count + 1 };
}
