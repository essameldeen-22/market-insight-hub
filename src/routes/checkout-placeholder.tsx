import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/context";
import { SiteNav, SiteFooter } from "@/components/SiteNav";

// TODO: Stripe integration point

export const Route = createFileRoute("/checkout-placeholder")({
  head: () => ({
    meta: [
      { title: "Checkout — Market Intelligence Suite" },
      { name: "description", content: "Upgrade checkout for Market Intelligence Suite is not live yet. Every module stays available on the free plan meanwhile." },
      { property: "og:title", content: "Checkout — Market Intelligence Suite" },
      { property: "og:description", content: "Paid plans are coming soon. Keep using the free plan for competitor analysis, SaaS audit, pricing and ROI." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/checkout-placeholder" }],
  }),
  component: CheckoutPlaceholder,
});

function CheckoutPlaceholder() {
  const { t } = useI18n();
  return (
    <>
      <div className="bg-mesh" />
      <SiteNav />
      <section className="hero">
        <h1><span>{t("checkout.title")}</span></h1>
        <p>{t("checkout.body")}</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <Link to="/pricing" className="nav-btn">{t("checkout.back")}</Link>
          <Link to="/app" className="nav-btn primary">{t("nav.dashboard")}</Link>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
