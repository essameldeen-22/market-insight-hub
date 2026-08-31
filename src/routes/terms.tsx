import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/i18n/context";
import { SiteNav, SiteFooter } from "@/components/SiteNav";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Market Intelligence Suite" },
      { name: "description", content: "Terms governing the use of Market Intelligence Suite: account, acceptable use, AI-generated analysis, and cancellation." },
      { property: "og:title", content: "Terms of Service" },
      { property: "og:description", content: "Read the terms that govern using Market Intelligence Suite." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  return (
    <>
      <div className="bg-mesh" />
      <SiteNav />
      <section className="hero"><h1><span>{isAr ? "شروط الاستخدام" : "Terms of Service"}</span></h1>
        <p>{isAr ? "آخر تحديث: يوليو 2026" : "Last updated: July 2026"}</p>
      </section>
      <article style={{ maxWidth: 760, margin: "0 auto 6rem", padding: "0 2rem", color: "var(--text2)", fontSize: "0.95rem", lineHeight: 1.7 }}>
        {isAr ? (
          <>
            <h3>١. القبول</h3>
            <p>باستخدامك Market Intelligence Suite (&quot;الخدمة&quot;) فأنت توافق على هذه الشروط. إن لم توافق، فلا تستخدم الخدمة.</p>

            <h3>٢. الحسابات</h3>
            <p>أنت مسؤول عن الحفاظ على سرية بيانات الدخول وعن جميع الأنشطة التي تحدث ضمن حسابك. يجب أن يكون عمرك ١٨ عاماً فأكثر لإنشاء حساب.</p>

            <h3>٣. الاستخدام المقبول</h3>
            <p>ممنوع: (أ) إدخال بيانات مسروقة أو منتهكة لحقوق الملكية الفكرية أو محتوى غير قانوني، (ب) محاولة اختراق أو إساءة استخدام البنية التحتية، (ج) استخدام تلقائي لكشط بيانات مراجعات من طرف ثالث بشكل ينتهك شروطهم (Amazon, Google, Trustpilot, …). أنت مسؤول قانونياً عن مصدر أي مراجعات تلصقها في الأداة.</p>

            <h3>٤. تحليل الذكاء الاصطناعي</h3>
            <p>تُرسَل نصوص المراجعات إلى Google Gemini لتحليل المشاعر والمواضيع. النتائج تقديرية وليست نصيحة قانونية أو مالية أو استثمارية. أنت مسؤول عن التحقق قبل اتخاذ قرارات تجارية بناءً عليها.</p>

            <h3>٥. الاشتراكات المدفوعة</h3>
            <p>الفوترة الفعلية لخطة Pro لم تُفعَّل بعد؛ وحال تفعيلها ستتم عبر مزود دفع خارجي معتمد. يمكنك الإلغاء في أي وقت وستستمر خدمتك حتى نهاية دورة الفوترة الحالية. لا استرداد لأشهر مضت. الأسعار قابلة للتغيير بإشعار مسبق ٣٠ يوماً.</p>

            <h3>٦. الملكية</h3>
            <p>تحتفظ بجميع حقوق البيانات التي ترفعها. نحتفظ بجميع حقوق الكود والتصميم والعلامة التجارية للخدمة.</p>

            <h3>٧. إخلاء المسؤولية</h3>
            <p>تُقدَّم الخدمة &quot;كما هي&quot;. لا ضمان لدقة التحليلات أو استمرارية الخدمة بلا انقطاع. الحد الأقصى لمسؤوليتنا التراكمية = ما دفعته لنا في آخر ١٢ شهراً.</p>

            <h3>٨. الإنهاء</h3>
            <p>يحق لك حذف حسابك في أي وقت من إعدادات لوحة التحكم — وسيتم حذف جميع بياناتك نهائياً. يحق لنا تعليق حسابات تنتهك هذه الشروط.</p>

            <h3>٩. القانون الحاكم</h3>
            <p>لم تُسجَّل الخدمة بعد ككيان قانوني رسمي. سيُحدَّد القانون الحاكم والاختصاص القضائي صراحةً في هذه الصفحة فور إتمام تسجيل الخدمة رسمياً من قِبل مالكها/مشغّلها، وسنخطر المستخدمين بذلك. حتى ذلك الحين تُحل النزاعات ودياً عبر التواصل المباشر.</p>
          </>
        ) : (
          <>
            <h3>1. Acceptance</h3>
            <p>By using Market Intelligence Suite (&quot;the Service&quot;) you agree to these Terms. If you don&apos;t agree, don&apos;t use the Service.</p>

            <h3>2. Accounts</h3>
            <p>You are responsible for keeping your credentials confidential and for everything that happens under your account. You must be 18 or older to create an account.</p>

            <h3>3. Acceptable Use</h3>
            <p>You will not: (a) submit stolen, IP-infringing, or unlawful content; (b) probe, attack, or abuse our infrastructure; (c) use the tool to automate scraping of third-party review sources (Amazon, Google, Trustpilot, etc.) in violation of their terms. You are legally responsible for the source of any review text you paste into the tool.</p>

            <h3>4. AI Analysis</h3>
            <p>Review text you submit is sent to Google Gemini for sentiment and topic analysis. Results are directional, not legal, financial, or investment advice. You are responsible for verifying findings before making business decisions.</p>

            <h3>5. Paid Subscriptions</h3>
            <p>Pro plan billing is not active yet; when enabled, it will be processed through a third-party payment provider. You can cancel any time and your service continues until the end of the current billing period. No refunds for past periods. Prices may change with 30 days&apos; notice.</p>

            <h3>6. Ownership</h3>
            <p>You retain all rights to data you upload. We retain all rights to the Service&apos;s code, design, and brand.</p>

            <h3>7. Disclaimer &amp; Liability</h3>
            <p>The Service is provided &quot;as is&quot;. We don&apos;t warrant analysis accuracy or uninterrupted availability. Our maximum cumulative liability equals what you paid us in the last 12 months.</p>

            <h3>8. Termination</h3>
            <p>You can delete your account at any time from the dashboard settings — all your data is permanently removed. We may suspend accounts that violate these Terms.</p>

            <h3>9. Governing Law</h3>
            <p>The Service is not yet incorporated as a formal legal entity. The governing law and jurisdiction will be specified explicitly on this page once the Service is formally registered by its owner/operator, and users will be notified of the change. Until then, disputes are resolved amicably through direct contact.</p>
          </>
        )}
      </article>
      <SiteFooter />
    </>
  );
}
