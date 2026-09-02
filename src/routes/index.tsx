import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Reveal, CountUp, HeroVisual } from "@/components/landing/motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Market Intelligence Suite: Competitor Analysis, SaaS Audit, Pricing & ROI" },
      { name: "description", content: "Analyze competitor reviews with AI, audit your SaaS stack, calculate optimal pricing and ROI. Arabic & English, multi-currency." },
      { property: "og:title", content: "Market Intelligence Suite" },
      { property: "og:description", content: "AI-powered competitor analysis, SaaS cost optimization, pricing & ROI calculators: Arabic & English." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const cards = [
    { icon: "📊", klass: "purple", title: t("cards.competitor.title"), desc: t("cards.competitor.desc"), badge: t("cards.competitor.badge") },
    { icon: "💼", klass: "orange", title: t("cards.saas.title"), desc: t("cards.saas.desc"), badge: t("cards.saas.badge") },
    { icon: "💰", klass: "green", title: t("cards.pricing.title"), desc: t("cards.pricing.desc"), badge: t("cards.pricing.badge") },
    { icon: "📈", klass: "blue", title: t("cards.roi.title"), desc: t("cards.roi.desc"), badge: t("cards.roi.badge") },
  ];

  const cta = () => {
    if (signedIn) navigate({ to: "/app" });
    else navigate({ to: "/auth" });
  };

  // Split the hero subtitle around its "80%" stat so it can count up.
  const [subA, subB] = t("hero.subtitle").split("80%");

  return (
    <>
      <div className="bg-mesh" />
      <SiteNav />

      <section className="hero landing-hero">
        <HeroVisual />
        <div className="hero-content">
          <Reveal className="badge-wrap"><div className="badge"><span className="badge-dot" />{t("hero.badge")}</div></Reveal>
          <Reveal delay={80}><h1><span>{t("hero.title.a")}</span> {t("hero.title.b")}</h1></Reveal>
          <Reveal delay={160}>
            <p>
              {subA}
              {subB !== undefined && <><CountUp to={80} suffix="%" />{subB}</>}
            </p>
          </Reveal>
          <Reveal delay={240}>
            <button className="nav-btn primary hero-cta" onClick={cta}>{t("hero.cta")} →</button>
          </Reveal>
        </div>
      </section>

      <div className="tools-grid landing-tools">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 90}>
            <div className="tool-card" onClick={cta} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cta(); } }}>
              <div className={`tool-icon ${c.klass}`}>{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <span className="tool-badge">{c.badge}</span>
            </div>
          </Reveal>
        ))}
      </div>

      <SiteFooter />
    </>
  );
}
