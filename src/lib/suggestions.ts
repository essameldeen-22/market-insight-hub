// Pure state-transition logic for crowdsourced SaaS-alternative suggestions.
// Kept free of Supabase imports so it can be unit tested directly.

export type SuggestionStatus = "pending" | "approved" | "rejected";
export type ReviewAction = "approve" | "reject";

export interface Suggestion {
  id: string;
  from_tool: string;
  to_tool: string;
  save_pct: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  notes?: string | null;
  status: SuggestionStatus;
  review_reason?: string | null;
  created_at?: string;
}

export interface ReviewOutcome {
  patch: {
    status: SuggestionStatus;
    review_reason: string | null;
    reviewed_by: string;
    reviewed_at: string;
  };
  /** Row to insert into `saas_alternatives` when approved. */
  alternative: {
    from_tool: string;
    to_tool: string;
    save_pct: number;
    difficulty: string;
    category: string;
    notes: string | null;
  } | null;
}

export class SuggestionReviewError extends Error {}

/**
 * Compute the result of an admin review. Throws when the suggestion has
 * already been reviewed: reviews are one-way and not repeatable.
 */
export function reviewTransition(
  suggestion: Pick<Suggestion, "status" | "from_tool" | "to_tool" | "save_pct" | "difficulty" | "category" | "notes">,
  action: ReviewAction,
  reviewerId: string,
  reason?: string | null,
  now: Date = new Date(),
): ReviewOutcome {
  if (suggestion.status !== "pending") {
    throw new SuggestionReviewError(`Suggestion already ${suggestion.status}`);
  }
  const patch = {
    status: (action === "approve" ? "approved" : "rejected") as SuggestionStatus,
    review_reason: reason?.trim() ? reason.trim() : null,
    reviewed_by: reviewerId,
    reviewed_at: now.toISOString(),
  };
  if (action === "reject") return { patch, alternative: null };
  return {
    patch,
    alternative: {
      from_tool: suggestion.from_tool.trim().toLowerCase(),
      to_tool: suggestion.to_tool.trim(),
      save_pct: suggestion.save_pct,
      difficulty: suggestion.difficulty,
      category: suggestion.category,
      notes: suggestion.notes ?? null,
    },
  };
}
