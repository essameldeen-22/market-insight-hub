// Server-only: Claude-powered value proposition generator.
import Anthropic from "@anthropic-ai/sdk";

export interface ValuePropResult {
  outcome: string;
  pain: string;
  differentiator: string;
  elevator: string;
}

const SYSTEM_PROMPT_EN = `You are a senior positioning strategist. Given a product, target customer, key pains, and differentiator, produce EXACTLY this strict JSON — no markdown, no commentary:

{
  "outcome": "one outcome-focused value proposition sentence (what the customer achieves)",
  "pain": "one pain-focused value proposition sentence (what pain disappears)",
  "differentiator": "one differentiation-focused value proposition sentence (why us, not them)",
  "elevator": "a single one-line elevator pitch, punchy, under 20 words"
}

Rules: concrete, no jargon, no hype adjectives ("revolutionary", "world-class"). Each statement must be usable as-is on a landing hero. Return ONLY the JSON.`;

const SYSTEM_PROMPT_AR = `أنت خبير تموضع منتجات. من اسم المنتج، وصف الجمهور، أهم نقاط الألم، والتمييز، أنتِج JSON صارم فقط بالتنسيق التالي — بدون Markdown ولا شرح:

{
  "outcome": "عبارة قيمة مركّزة على النتيجة (ماذا سيحقق العميل)",
  "pain": "عبارة قيمة مركّزة على إزالة الألم (أي معاناة تختفي)",
  "differentiator": "عبارة قيمة مركّزة على التمييز (لماذا نحن لا هم)",
  "elevator": "جملة مصعد واحدة قصيرة أقل من ٢٠ كلمة"
}

قواعد: عبارات ملموسة، بلا مبالغات ("ثوري"، "الأفضل عالمياً")، صالحة كما هي لصفحة هبوط. أعِد JSON فقط.`;

export async function generateValueProp(input: {
  product: string;
  target: string;
  pains: string;
  differentiator: string;
  lang: "ar" | "en";
}): Promise<ValuePropResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  const client = new Anthropic({ apiKey });
  const system = input.lang === "ar" ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN;
  const user =
    input.lang === "ar"
      ? `المنتج: ${input.product}\nالجمهور المستهدف: ${input.target}\nنقاط الألم: ${input.pains}\nالتمييز الرئيسي: ${input.differentiator}`
      : `Product: ${input.product}\nTarget customer: ${input.target}\nTop pains: ${input.pains}\nKey differentiator: ${input.differentiator}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 800,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned) as ValuePropResult;
}
