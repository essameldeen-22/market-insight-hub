import { describe, expect, it } from "vitest";
import { limitForPlan, normalizePlan } from "@/lib/plan-limits";
import { isRateLimited } from "@/lib/rate-limit";

describe("plan-based daily limits", () => {
  it("normalizes unknown or missing plans to free", () => {
    expect(normalizePlan(undefined)).toBe("free");
    expect(normalizePlan("enterprise")).toBe("free");
    expect(normalizePlan("pro")).toBe("pro");
    expect(normalizePlan("team")).toBe("team");
  });

  it("maps plans to 3 / 20 / unlimited", () => {
    expect(limitForPlan("free")).toBe(3);
    expect(limitForPlan("pro")).toBe(20);
    expect(limitForPlan("team")).toBe(Number.POSITIVE_INFINITY);
  });

  it("gates calls per plan", () => {
    expect(isRateLimited(3, limitForPlan("free"))).toBe(true);
    expect(isRateLimited(3, limitForPlan("pro"))).toBe(false);
    expect(isRateLimited(19, limitForPlan("pro"))).toBe(false);
    expect(isRateLimited(20, limitForPlan("pro"))).toBe(true);
    expect(isRateLimited(9999, limitForPlan("team"))).toBe(false);
  });
});
