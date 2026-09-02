import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/i18n/context";
import { SiteNav, SiteFooter } from "@/components/SiteNav";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Market Intelligence Suite" },
      { name: "description", content: "What data we collect, how we use it, and who we share it with: including our use of Google Gemini for AI analysis." },
      { property: "og:title", content: "Privacy Policy" },
      { property: "og:description", content: "What we collect, how long we keep it, and your rights." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  return (
    <>
      <div className="bg-mesh" />
      <SiteNav />
      <section className="hero"><h1><span>{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</span></h1>
        <p>{isAr ? "آخر تحديث: يوليو 2026" : "Last updated: July 2026"}</p>
      </section>
      <article style={{ maxWidth: 760, margin: "0 auto 6rem", padding: "0 2rem", color: "var(--text2)", fontSize: "0.95rem", lineHeight: 1.7 }}>
        {isAr ? (
          <>
            <h3>ما الذي نجمعه</h3>
            <ul>
              <li><strong>بيانات الحساب:</strong> البريد الإلكتروني، اسم العرض، وتفضيلات اللغة/العملة/الثيم.</li>
              <li><strong>مدخلاتك في الأدوات:</strong> نصوص مراجعات المنافسين، قوائم أدوات SaaS، مدخلات حاسبات التسعير و ROI. تُخزَّن هذه في قاعدة بيانات Supabase وتقتصر الرؤية على حسابك عبر Row-Level Security.</li>
              <li><strong>رسائل التواصل:</strong> إذا استخدمت نموذج الاتصال في صفحة &quot;من نحن&quot;.</li>
              <li><strong>تسجيل خفيف من الخادم:</strong> أخطاء تقنية، لا نتتبع سلوكاً تسويقياً.</li>
            </ul>

            <h3>معالجات من طرف ثالث</h3>
            <ul>
              <li><strong>Supabase:</strong> استضافة قاعدة البيانات والمصادقة.</li>
              <li><strong>Google Gemini:</strong> نصوص المراجعات التي تُدخلها تُرسَل إلى Google لتحليل المشاعر والمواضيع. نستخدم حالياً الطبقة المجانية من Gemini API، وقد تستخدم Google هذه البيانات لتحسين خدماتها؛ لذا لا تُدخل بيانات سرية.</li>
              <li><strong>Stripe:</strong> عند الاشتراك في Pro، تُعالج بيانات الدفع بواسطة Stripe مباشرة، ولا نرى أرقام البطاقات.</li>
              <li><strong>Frankfurter API:</strong> لجلب أسعار صرف العملات (طلب مجهول من متصفحك).</li>
              <li><strong>Google OAuth:</strong> اختياري لتسجيل الدخول.</li>
            </ul>

            <h3>مدة الاحتفاظ</h3>
            <p>نحتفظ ببياناتك طالما بقي حسابك نشطاً. عند حذف حسابك من إعدادات لوحة التحكم، تُمحى جميع بياناتك (تحليلات، قوائم SaaS، حالة التسعير و ROI، ورسائل التواصل المرتبطة بحسابك) نهائياً في نفس الطلب.</p>

            <h3>حقوقك</h3>
            <p>يمكنك في أي وقت: تصدير بياناتك (عبر التواصل معنا)، تصحيحها، أو حذفها بالكامل من واجهة التطبيق. لا نبيع بياناتك أبداً.</p>

            <h3>ملفات تعريف الارتباط</h3>
            <p>نستخدم localStorage لحفظ تفضيلات اللغة والعملة والثيم وجلسة المصادقة. لا نستخدم كوكيز تتبع أو إعلانات.</p>

            <h3>تواصل بخصوص الخصوصية</h3>
            <p>استخدم نموذج الاتصال في صفحة &quot;من نحن&quot; لأي طلب متعلق بالخصوصية.</p>
          </>
        ) : (
          <>
            <h3>What we collect</h3>
            <ul>
              <li><strong>Account data:</strong> email, display name, and your language/currency/theme preferences.</li>
              <li><strong>Your tool inputs:</strong> competitor review text, SaaS tool lists, pricing and ROI calculator inputs. Stored in a Supabase database, scoped to your account via Row-Level Security.</li>
              <li><strong>Contact messages:</strong> if you use the contact form on the About page.</li>
              <li><strong>Light server logs:</strong> technical errors only, with no behavioral or marketing tracking.</li>
            </ul>

            <h3>Third-party processors</h3>
            <ul>
              <li><strong>Supabase:</strong> database and authentication hosting.</li>
              <li><strong>Google Gemini:</strong> review text you submit is sent to Google for sentiment and topic analysis. We currently use the free Gemini API tier, where Google may use submitted data to improve its services &mdash; so do not submit confidential text.</li>
              <li><strong>Stripe:</strong> when you subscribe to Pro, payment details are handled by Stripe directly, and we never see card numbers.</li>
              <li><strong>Frankfurter API:</strong> anonymous request from your browser to fetch currency exchange rates.</li>
              <li><strong>Google OAuth:</strong> optional sign-in provider.</li>
            </ul>

            <h3>Retention</h3>
            <p>We keep your data as long as your account is active. When you delete your account from dashboard settings, all your data (analyses, SaaS lists, pricing/ROI state, and contact messages linked to your account) is permanently removed in the same request.</p>

            <h3>Your rights</h3>
            <p>You can at any time: export your data (via contact request), correct it, or delete it entirely from within the app. We never sell your data.</p>

            <h3>Cookies</h3>
            <p>We use browser <code>localStorage</code> to remember your language, currency, theme, and auth session. No tracking or advertising cookies.</p>

            <h3>Privacy contact</h3>
            <p>Use the contact form on the About page for any privacy request.</p>
          </>
        )}
      </article>
      <SiteFooter />
    </>
  );
}
