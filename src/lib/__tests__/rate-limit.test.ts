import { describe, expect, it } from "vitest";
import {
  DAILY_FREE_LIMIT,
  dayKey,
  isRateLimited,
  nextUsage,
  remaining,
  usageForToday,
} from "@/lib/rate-limit";

describe("analysis rate limiting", () => {
  it("treats a missing usage row as zero usage", () => {
    expect(usageForToday(null, "2026-08-01")).toBe(0);
    expect(usageForToday(undefined, "2026-08-01")).toBe(0);
  });

  it("ignores a stale row from a previous day", () => {
    expect(usageForToday({ count: 3, day: "2026-07-31" }, "2026-08-01")).toBe(0);
  });

  it("counts today's row", () => {
    expect(usageForToday({ count: 2, day: "2026-08-01" }, "2026-08-01")).toBe(2);
  });

  it("allows calls below the daily limit and blocks at the limit", () => {
    expect(isRateLimited(0)).toBe(false);
    expect(isRateLimited(DAILY_FREE_LIMIT - 1)).toBe(false);
    expect(isRateLimited(DAILY_FREE_LIMIT)).toBe(true);
    expect(isRateLimited(DAILY_FREE_LIMIT + 5)).toBe(true);
  });

  it("reports remaining quota, never negative", () => {
    expect(remaining(0)).toBe(DAILY_FREE_LIMIT);
    expect(remaining(2)).toBe(DAILY_FREE_LIMIT - 2);
    expect(remaining(99)).toBe(0);
  });

  it("increments the counter for the upsert row", () => {
    expect(nextUsage(0, "2026-08-01")).toEqual({ day: "2026-08-01", count: 1 });
    expect(nextUsage(2, "2026-08-01")).toEqual({ day: "2026-08-01", count: 3 });
  });

  it("blocks the fourth call in a simulated day and resets the next day", () => {
    let row = { count: 0, day: "2026-08-01" };
    const runs: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      const count = usageForToday(row, "2026-08-01");
      if (isRateLimited(count)) { runs.push(false); continue; }
      runs.push(true);
      row = { ...nextUsage(count, "2026-08-01") };
    }
    expect(runs).toEqual([true, true, true, false]);
    // New day → stale row no longer counts.
    expect(isRateLimited(usageForToday(row, "2026-08-02"))).toBe(false);
  });

  it("produces a UTC yyyy-mm-dd day key", () => {
    expect(dayKey(new Date("2026-08-01T23:59:59Z"))).toBe("2026-08-01");
  });
});
