import { createFileRoute } from "@tanstack/react-router";
import { GuidePage, articleLd } from "@/components/GuidePage";

const TITLE = { ar: 'استراتيجية تسعير SaaS للسوق العربي', en: 'SaaS pricing strategy for the Arabic market' };
const INTRO = { ar: 'كيف تبني خطط تسعير مبنية على القيمة، ولماذا تعمل الخطط الثلاث، وكيف تحسب نقطة التعادل قبل أي تغيير في السعر.', en: 'How to build value-based pricing plans, why three tiers work, and how to compute the break-even point before any price change.' };

export const Route = createFileRoute("/guides/saas-pricing-strategy")({
  head: () => ({
    meta: [
      { title: TITLE.ar + " | Market Intelligence Suite" },
      { name: "description", content: INTRO.ar },
      { property: "og:title", content: TITLE.ar },
      { property: "og:description", content: INTRO.ar },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/guides/saas-pricing-strategy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/guides/saas-pricing-strategy" }],
    scripts: [
      { type: "application/ld+json", children: articleLd(TITLE.ar, INTRO.ar, "/guides/saas-pricing-strategy") },
    ],
  }),
  component: () => (
    <GuidePage
      title={TITLE}
      intro={INTRO}
      sections={[
    { h: { ar: 'ابدأ من القيمة وليس من التكلفة', en: 'Start from value, not cost' }, p: [{ ar: 'التسعير بناءً على التكلفة زائد هامش يترك المال على الطاولة. السؤال الصحيح: كم يوفّر منتجك للعميل أو كم يكسبه شهرياً؟ ثم سعّر بجزء من تلك القيمة.', en: 'Cost-plus pricing leaves money on the table. The right question: how much does your product save or earn the customer monthly? Then price at a fraction of that value.' }] },
    { h: { ar: 'ثلاث خطط أفضل من خطة واحدة', en: 'Three plans beat one' }, p: [{ ar: 'الخطط الثلاث تخدم ثلاثة أنواع من المشترين وتجعل الخطة الوسطى تبدو الخيار العقلاني.', en: 'Three plans serve three buyer types and make the middle plan look like the rational choice.' }], list: [{ ar: 'خطة دخول منخفضة المخاطر لتجربة المنتج.', en: 'A low-risk entry plan to try the product.' }, { ar: 'خطة أساسية هي الأكثر مبيعاً ويُبنى عليها التموضع.', en: 'A core plan that is the best-seller and anchors positioning.' }, { ar: 'خطة أعلى للفرق التي تحتاج حدوداً أكبر أو دعماً أسرع.', en: 'A higher plan for teams needing bigger limits or faster support.' }] },
    { h: { ar: 'احسب العائد قبل أن ترفع السعر', en: 'Model the ROI before raising price' }, p: [{ ar: 'قبل أي تغيير سعري، اختبر ثلاثة سيناريوهات: متفائل وواقعي ومتحفظ، واحسب نقطة التعادل في كل منها. رفع السعر 20% مع فقدان 10% من العملاء قد يكون مربحاً أو كارثياً، والفرق يظهر في الأرقام فقط.', en: 'Before any price change, test three scenarios: optimistic, realistic, conservative, then compute the break-even point for each. A 20% increase with 10% churn can be profitable or disastrous; only the numbers tell you which.' }] },
  ]}
      cta={{ ar: 'استخدم حاسبة التسعير وحاسبة العائد لاختبار سيناريوهات السعر ونقطة التعادل قبل الإطلاق.', en: 'Use the pricing and ROI calculators to test price scenarios and break-even before launch.' }}
      related={[{ to: '/guides/saas-cost-audit', label: { ar: 'دليل تدقيق تكاليف SaaS', en: 'SaaS cost audit guide' } }, { to: '/guides/competitor-review-analysis', label: { ar: 'تحليل مراجعات المنافسين', en: 'Competitor review analysis' } }]}
    />
  ),
});
