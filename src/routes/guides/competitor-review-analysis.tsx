import { createFileRoute } from "@tanstack/react-router";
import { GuidePage, articleLd } from "@/components/GuidePage";

const TITLE = { ar: 'تحليل مراجعات المنافسين: دليل عملي', en: 'Competitor review analysis: a practical guide' };
const INTRO = { ar: 'كيف تحوّل مراجعات عملاء منافسيك إلى قرارات منتج وتموضع تسويقي واضح، مع خطوات تصنيف المواضيع واستخراج نقاط الألم المتكررة.', en: "How to turn your competitors' customer reviews into product and positioning decisions, with steps for topic tagging and extracting recurring pain points." };

export const Route = createFileRoute("/guides/competitor-review-analysis")({
  head: () => ({
    meta: [
      { title: TITLE.ar + " | Market Intelligence Suite" },
      { name: "description", content: INTRO.ar },
      { property: "og:title", content: TITLE.ar },
      { property: "og:description", content: INTRO.ar },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/guides/competitor-review-analysis" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/guides/competitor-review-analysis" }],
    scripts: [
      { type: "application/ld+json", children: articleLd(TITLE.ar, INTRO.ar, "/guides/competitor-review-analysis") },
    ],
  }),
  component: () => (
    <GuidePage
      title={TITLE}
      intro={INTRO}
      sections={[
    { h: { ar: 'ما هي مراجعات المنافسين ولماذا هي أرخص بحث سوقي؟', en: "What competitor reviews are, and why they're the cheapest market research" }, p: [{ ar: 'مراجعات عملاء منافسك هي بحث سوقي مجاني كتبه عملاؤك المحتملون بأنفسهم: يخبرونك بما يعجبهم، وبما يدفعهم للمغادرة.', en: "Your competitor's customer reviews are free market research written by your future customers: they tell you what delights them and what makes them leave." }] },
    { h: { ar: 'كيف تحلل المراجعات بشكل منهجي', en: 'How to analyse reviews systematically' }, p: [{ ar: 'لا تقرأ المراجعات قراءة عشوائية. صنّفها حتى تتحول إلى قرارات.', en: "Don't read reviews at random. Classify them until they turn into decisions." }], list: [{ ar: 'اجمع من 50 إلى 200 مراجعة من مصادر مسموح بها رسمياً (لا كشط مخالف للشروط).', en: 'Collect 50-200 reviews from officially permitted sources: no scraping that violates terms.' }, { ar: 'صنّف كل مراجعة إلى موضوع: السعر، الدعم، الأداء، سهولة الاستخدام.', en: 'Tag each review by topic: price, support, performance, ease of use.' }, { ar: 'افصل بين الشكوى المتكررة والشكوى النادرة: التكرار هو الإشارة.', en: 'Separate recurring complaints from one-off ones: repetition is the signal.' }, { ar: 'حوّل كل شكوى متكررة إلى فرصة تموضع واضحة لمنتجك.', en: 'Turn each recurring complaint into a clear positioning opportunity.' }] },
    { h: { ar: 'من الشكوى إلى التموضع', en: 'From complaint to positioning' }, p: [{ ar: 'نقاط القوة المتكررة عند المنافس هي حد أدنى يجب أن تضاهيه، وليست ميزة تنافسية لك. أما الشكاوى المتكررة فهي المساحة الوحيدة التي يمكنك أن تبني عليها رسالة تسويقية تصمد.', en: "A competitor's recurring strengths are table stakes you must match, not your differentiator. Their recurring complaints are the only space where a durable marketing message can be built." }] },
  ]}
      cta={{ ar: 'الصق مراجعات منافسك في أداة تحليل المنافسين واحصل على المواضيع ونقاط الألم والتوصيات الاستراتيجية.', en: 'Paste competitor reviews into the analysis tool to get topics, pain points and strategic recommendations.' }}
      related={[{ to: '/guides/saas-cost-audit', label: { ar: 'دليل تدقيق تكاليف SaaS', en: 'SaaS cost audit guide' } }, { to: '/guides/saas-pricing-strategy', label: { ar: 'استراتيجية تسعير SaaS', en: 'SaaS pricing strategy' } }]}
    />
  ),
});
