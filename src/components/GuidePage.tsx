// Shared layout for the Arabic-first SEO guide pages.
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { useI18n } from "@/i18n/context";

export interface GuideSection {
  h: { ar: string; en: string };
  p: { ar: string; en: string }[];
  list?: { ar: string; en: string }[];
}

export function GuidePage({
  title,
  intro,
  sections,
  cta,
  related,
}: {
  title: { ar: string; en: string };
  intro: { ar: string; en: string };
  sections: GuideSection[];
  cta: { ar: string; en: string };
  related: { to: string; label: { ar: string; en: string } }[];
}) {
  const { lang } = useI18n();
  const L = (v: { ar: string; en: string }) => v[lang === "ar" ? "ar" : "en"];
  const isAr = lang === "ar";

  return (
    <>
      <div className="bg-mesh" />
      <SiteNav />
      <section className="hero">
        <h1><span>{L(title)}</span></h1>
        <p>{L(intro)}</p>
      </section>
      <article
        style={{ maxWidth: 780, margin: "0 auto 4rem", padding: "0 2rem", color: "var(--text2)", fontSize: "0.95rem", lineHeight: 1.8 }}
      >
        {sections.map((s, i) => (
          <section key={i}>
            <h2 style={{ color: "var(--text)", fontSize: "1.15rem", marginTop: "2.2rem" }}>{L(s.h)}</h2>
            {s.p.map((p, j) => <p key={j}>{L(p)}</p>)}
            {s.list && (
              <ul style={{ paddingInlineStart: "1.2rem" }}>
                {s.list.map((li, j) => <li key={j} style={{ marginBottom: "0.4rem" }}>{L(li)}</li>)}
              </ul>
            )}
          </section>
        ))}

        <div className="insight-box info" style={{ marginTop: "2.5rem" }}>
          <p style={{ margin: 0 }}>{L(cta)}</p>
          <Link to="/app" className="btn btn-primary btn-sm" style={{ marginTop: "0.8rem", display: "inline-block" }}>
            {isAr ? "افتح الأداة مجاناً" : "Open the tool for free"}
          </Link>
        </div>

        <nav style={{ marginTop: "2.5rem" }} aria-label={isAr ? "أدلة ذات صلة" : "Related guides"}>
          <h2 style={{ color: "var(--text)", fontSize: "1rem" }}>{isAr ? "أدلة ذات صلة" : "Related guides"}</h2>
          <ul style={{ paddingInlineStart: "1.2rem" }}>
            {related.map((r) => (
              <li key={r.to} style={{ marginBottom: "0.35rem" }}>
                <Link to={r.to} style={{ color: "var(--accent)" }}>{L(r.label)}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
      <SiteFooter />
    </>
  );
}

export function guideJsonLd(o: {
  headline: string;
  description: string;
  url: string;
  inLanguage: string;
}): ReactNode {
  return null; // JSON-LD is injected through route head() scripts instead.
}

export function articleLd(headline: string, description: string, url: string, inLanguage = "ar") {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    inLanguage,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "Market Intelligence Suite" },
    publisher: { "@type": "Organization", name: "Market Intelligence Suite" },
  });
}
