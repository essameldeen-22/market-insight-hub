import { describe, expect, it } from "vitest";
import { reviewTransition, SuggestionReviewError } from "@/lib/suggestions";

const base = {
  status: "pending" as const,
  from_tool: "  Slack ",
  to_tool: "Rocket.Chat",
  save_pct: 0.9,
  difficulty: "medium" as const,
  category: "Communication",
  notes: null,
};

const NOW = new Date("2026-08-01T10:00:00Z");

describe("suggestion review flow", () => {
  it("approving marks it approved and yields a normalized alternative row", () => {
    const out = reviewTransition(base, "approve", "admin-1", null, NOW);
    expect(out.patch.status).toBe("approved");
    expect(out.patch.reviewed_by).toBe("admin-1");
    expect(out.patch.reviewed_at).toBe(NOW.toISOString());
    expect(out.alternative).toEqual({
      from_tool: "slack", // trimmed + lowercased for lookup
      to_tool: "Rocket.Chat",
      save_pct: 0.9,
      difficulty: "medium",
      category: "Communication",
      notes: null,
    });
  });

  it("rejecting stores the reason and creates no alternative", () => {
    const out = reviewTransition(base, "reject", "admin-1", "  not comparable  ", NOW);
    expect(out.patch.status).toBe("rejected");
    expect(out.patch.review_reason).toBe("not comparable");
    expect(out.alternative).toBeNull();
  });

  it("treats a blank reason as no reason", () => {
    const out = reviewTransition(base, "reject", "admin-1", "   ", NOW);
    expect(out.patch.review_reason).toBeNull();
  });

  it("refuses to re-review an already decided suggestion", () => {
    for (const status of ["approved", "rejected"] as const) {
      expect(() => reviewTransition({ ...base, status }, "approve", "admin-1", null, NOW))
        .toThrow(SuggestionReviewError);
    }
  });
});
