// Server-only: shared Google Gemini (AI Studio free tier) JSON call.
// Free tier only: no Google Cloud Billing involved.
import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";

/** Concatenates every text part across Gemini's candidate/parts response shape. */
export function extractText(response: GenerateContentResponse): string {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const joined = parts
    .map((p) => (typeof p.text === "string" ? p.text : ""))
    .join("")
    .trim();
  if (joined) return joined;
  // Fallback to the SDK's convenience accessor when parts are shaped differently.
  return (response.text ?? "").trim();
}

/**
 * Runs a prompt through Gemini asking for strict JSON, then parses it.
 * `responseMimeType: "application/json"` is Gemini's native structured-output
 * switch and greatly reduces malformed responses.
 */
export async function generateJson<T>(opts: {
  system: string;
  user: string;
  model?: string;
  maxOutputTokens?: number;
}): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: opts.model ?? "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    config: {
      systemInstruction: opts.system,
      responseMimeType: "application/json",
      ...(opts.maxOutputTokens ? { maxOutputTokens: opts.maxOutputTokens } : {}),
    },
  });

  const raw = extractText(response);
  if (!raw) throw new Error("Model returned an empty response");

  // Defensive: strip code fences in case the model wraps the JSON anyway.
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Model did not return valid JSON: ${cleaned.slice(0, 200)}`);
  }
}
