// Server-only helper: sentiment + topic analysis for competitor reviews.
// Uses Google Gemini (AI Studio free tier) with native JSON output.

import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash";

export interface TopicResult {
  topic: string;
  count: number;
  positive: number;
  negative: number;
  neutral: number;
  lean: "strength" | "pain" | "split" | "neutral";
}

export interface AnalysisResult {
  totalReviews: number;
  sentiment: { positive: number; negative: number; mixed: number; neutral: number };
  topics: TopicResult[];
  pains: { title: string; description: string }[];
  strengths: { title: string; description: string }[];
}

const SYSTEM_PROMPT = `You are a senior market-strategy analyst advising a founder who is deciding whether to compete with the product being reviewed. You will receive a list of product reviews (mixed English and Arabic).
Analyze them and return STRICT JSON matching this TypeScript type — no markdown, no commentary:

{
  "totalReviews": number,
  "sentiment": { "positive": number, "negative": number, "mixed": number, "neutral": number },
  "topics": [
    { "topic": string, "count": number, "positive": number, "negative": number, "neutral": number, "lean": "strength" | "pain" | "split" | "neutral" }
  ],
  "pains": [ { "title": string, "description": string } ],
  "strengths": [ { "title": string, "description": string } ]
}

Rules:
- Counts in "sentiment" must sum to totalReviews.
- Top 8 topics maximum, ordered by count desc. Topic names 1-3 words, in the dominant review language for that topic.
- lean = "strength" if positive dominates (>60% of topic mentions); "pain" if negative dominates; "split" if roughly balanced; "neutral" otherwise.

CRITICAL — pains and strengths are NOT summaries; they are strategic recommendations for the founder reading this report:

- "pains" = up to 5 recurring complaints. For each item:
  - title: the complaint in 2-5 words.
  - description: TWO sentences. Sentence 1 states the recurring complaint in concrete terms. Sentence 2 states the ACTIONABLE OPPORTUNITY for the founder — e.g. "Opportunity: lead your positioning on X, and benchmark it publicly against them" or "Opportunity: solve this by choosing architecture Y from day one; use it as your headline differentiator." Do not just restate the problem — recommend a specific, competitive move.

- "strengths" = up to 5 recurring praises. For each item:
  - title: the praise in 2-5 words.
  - description: TWO sentences. Sentence 1 states what they do well. Sentence 2 states the STRATEGIC IMPLICATION for the founder — e.g. "Table-stakes: you must match or exceed this to be considered; do NOT try to differentiate here" or "This is defensible for them; compete on adjacent axis Z instead of attacking this head-on."

- Descriptions must match the review language (Arabic reviews → Arabic descriptions; English reviews → English descriptions).
- Never invent facts not grounded in the reviews. If evidence is thin, say so briefly in the description.
- Return ONLY the JSON object, no code fences.`;

export async function analyzeReviews(productName: string, reviews: string[]): Promise<AnalysisResult> {
  const userMessage = `Product: ${productName || "(unnamed)"}\n\nReviews (${reviews.length}):\n${reviews.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;

  return generateJson<AnalysisResult>({
    system: SYSTEM_PROMPT,
    user: userMessage,
    model: MODEL,
    maxOutputTokens: 4096,
  });
}
