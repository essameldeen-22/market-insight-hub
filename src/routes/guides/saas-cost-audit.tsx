import { createFileRoute } from "@tanstack/react-router";
import { GuidePage, articleLd } from "@/components/GuidePage";

const TITLE = { ar: 'دليل تدقيق تكاليف SaaS للشركات الناشئة', en: 'SaaS cost audit guide for startups' };
const INTRO = { ar: 'كيف تدقّق اشتراكات SaaS في شركتك خطوة بخطوة، تكتشف المقاعد غير المستخدمة، وتقارن البدائل مفتوحة المصدر قبل حساب تكلفة الانتقال الحقيقية.', en: 'A step-by-step guide to auditing your SaaS subscriptions, finding unused seats, and comparing open-source alternatives with a realistic migration cost.' };

export const Route = createFileRoute("/guides/saas-cost-audit")({
  head: () => ({
    meta: [
      { title: TITLE.ar + " | Market Intelligence Suite" },
      { name: "description", content: INTRO.ar },
      { property: "og:title", content: TITLE.ar },
      { property: "og:description", content: INTRO.ar },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/guides/saas-cost-audit" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/guides/saas-cost-audit" }],
    scripts: [
      { type: "application/ld+json", children: articleLd(TITLE.ar, INTRO.ar, "/guides/saas-cost-audit") },
    ],
  }),
  component: () => (
    <GuidePage
      title={TITLE}
      intro={INTRO}
      sections={[
    { h: { ar: 'لماذا تتضخم فاتورة SaaS دون أن تلاحظ؟', en: 'Why SaaS bills grow unnoticed' }, p: [{ ar: 'تبدأ الشركات بأداة أو اثنتين، ثم يضيف كل قسم اشتراكاً صغيراً. بعد سنتين تجد 15 أداة، نصفها بمقاعد غير مستخدمة، والفاتورة السنوية تتجاوز راتب موظف كامل.', en: 'Companies start with one or two tools, then each team adds a small subscription. Two years later you have 15 tools, half of them with unused seats, and an annual bill larger than a full salary.' }], list: [{ ar: 'مقاعد لموظفين غادروا الشركة', en: 'Seats for employees who already left' }, { ar: 'أدوات متداخلة الوظائف بين الأقسام', en: 'Overlapping tools across departments' }, { ar: 'خطط سنوية تُجدَّد تلقائياً دون مراجعة', en: 'Annual plans auto-renewing without review' }] },
    { h: { ar: 'خطوات التدقيق العملي في أربع خطوات', en: 'A practical four-step audit' }, p: [{ ar: 'التدقيق الفعّال لا يحتاج أكثر من ساعة إذا اتبعت ترتيباً واضحاً.', en: 'An effective audit takes under an hour if you follow a clear order.' }], list: [{ ar: 'صدّر كشف حساب البطاقة أو الحساب البنكي كملف CSV واستورده مباشرة في أداة تدقيق SaaS.', en: 'Export your card or bank statement as CSV and import it straight into the SaaS audit tool.' }, { ar: 'سجّل لكل أداة: التكلفة الشهرية، عدد المقاعد، ونسبة الاستخدام الحقيقية.', en: 'For each tool record monthly cost, number of seats, and real usage percentage.' }, { ar: 'احذف المقاعد غير المستخدمة أولاً — هذا أسرع توفير بلا أي مخاطرة.', en: 'Remove unused seats first — the fastest saving with zero risk.' }, { ar: 'قارن كل أداة ببديل مفتوح المصدر واحسب تكلفة الانتقال الحقيقية قبل القرار.', en: 'Compare each tool with an open-source alternative and compute the real migration cost before deciding.' }] },
    { h: { ar: 'متى لا يكون الانتقال مجدياً؟', en: 'When migrating is not worth it' }, p: [{ ar: 'التوفير على الورق ليس توفيراً حقيقياً. احسب وقت الفريق، والتدريب، ومخاطر التوقف. إذا كانت تكلفة الانتقال تتجاوز توفير سنة كاملة، أبقِ الأداة وركّز على تقليل المقاعد أو التفاوض على الخطة.', en: "Savings on paper aren't real savings. Count team time, training, and downtime risk. If migration cost exceeds a full year of savings, keep the tool and focus on cutting seats or renegotiating." }] },
  ]}
      cta={{ ar: 'جرّب أداة تدقيق SaaS: استورد كشف حسابك، واحصل على تقدير التوفير وتكلفة الانتقال في دقائق.', en: 'Try the SaaS audit tool: import your statement and get savings plus migration cost in minutes.' }}
      related={[{ to: '/guides/competitor-review-analysis', label: { ar: 'تحليل مراجعات المنافسين', en: 'Competitor review analysis' } }, { to: '/guides/saas-pricing-strategy', label: { ar: 'استراتيجية تسعير SaaS', en: 'SaaS pricing strategy' } }]}
    />
  ),
});
