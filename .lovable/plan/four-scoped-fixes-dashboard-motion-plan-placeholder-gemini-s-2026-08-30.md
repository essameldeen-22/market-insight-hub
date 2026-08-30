# Four scoped fixes: dashboard motion, plan placeholder, Gemini swap, Value Prop rate limit

Delivered as four separate steps, in order, each with its own diff summary before code. Landing page, `motion.tsx`, visual design, and payment providers stay untouched.

## Task 1 — Make the dashboard feel alive

Reuse the existing `Reveal` and `CountUp` from `src/components/landing/motion.tsx` (import only — no edits to that file).

- New `src/components/dashboard/Skeleton.tsx`: shimmer placeholder blocks (CSS-only) matching the shape of the result cards.
- `CompetitorAnalysis.tsx`: while a product is `loading`, render the skeleton instead of the empty area; when the result arrives, wrap it in `Reveal` for a fade+slide-in; sentiment counts and topic counts render through `CountUp`.
- `ValueProp.tsx`: same skeleton while `generateValuePropFn` is in flight, `Reveal` on the generated output.
- `RoiCalculator.tsx` / `PricingCalculator.tsx` / `SaasAudit.tsx`: numeric stat cards (totals, savings, break-even) animate via `CountUp`; result panels get the fade+slide class.
- `src/styles.css`: add dashboard-scoped `.skeleton` shimmer and `.result-enter` transition, both disabled under `prefers-reduced-motion`.

No new dependencies. Currency/number formatting keeps Latin digits.

## Task 2 — Plan column and Stripe placeholder

- Migration: `ALTER TABLE public.profiles ADD COLUMN plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','team'))`. Existing profile RLS/grants unchanged (users read their own row).
- New `src/lib/plan-limits.ts`: `limitForPlan(plan)` → free 3, pro 50, team `Infinity`. Keeps `rate-limit.ts` untouched as the pure gate.
- `claude.functions.ts`: read the caller's `plan` from `profiles`, pass the resolved limit into `isRateLimited` / the returned `usage.limit` instead of the hardcoded `DAILY_FREE_LIMIT`.
- `/pricing`: "Upgrade" button on the Pro plan links to a new route `src/routes/checkout-placeholder.tsx` containing only `// TODO: Stripe integration point` plus a minimal placeholder render.

No Stripe SDK, no webhook, no provider activation.

## Task 3 — Anthropic to Gemini

- Install `@google/genai`; remove `@anthropic-ai/sdk` once both call sites migrate (confirm nothing else imports it first).
- Store `GEMINI_API_KEY` as a backend secret. The key you pasted in chat is now exposed in a message — I'll register it, but you should rotate it in AI Studio afterwards and give me the new one.
- `claude.server.ts` and `value-prop.server.ts`: swap the client to `GoogleGenAI` with `gemini-2.5-flash` (verifying the current recommended free-tier model name at implementation time), passing the existing system prompts unchanged via `config.systemInstruction`, and `config.responseMimeType: "application/json"` for structured output.
- Response parsing rewritten for Gemini's `candidates[].content.parts[].text` shape, with the existing fence-stripping and JSON-parse error path preserved.
- `AnalysisResult` and `ValuePropResult` interfaces are unchanged, so no frontend change. File names stay as-is to avoid churn across imports.
- No Google Cloud Billing reference anywhere.

## Task 4 — Rate-limit the Value Prop generator

- `value-prop.functions.ts` gets the same pattern as `analyzeReviewsFn`: read today's `analysis_usage` row, gate with `isRateLimited` against the plan-based limit from Task 2, throw `RATE_LIMIT_DAILY`, and upsert the bumped counter after a successful generation.
- The shared usage/plan lookup moves into one helper so both server functions use identical logic (no new rate-limit logic written).
- Shared counter: value-prop calls and review analyses draw from the same daily allowance.
- `ValueProp.tsx` shows the same friendly limit-reached message the competitor tool already shows.
- Existing tests keep passing; add a small test for `limitForPlan`.
