import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/i18n/context";
import { supabase } from "@/integrations/supabase/client";

// Single persistent nav used across every public and authenticated page.
// - Marketing links (Home, Why, Pricing, About) are always visible.
// - Dashboard link only appears when the user is signed in.
// - Authenticated pages pass `extras` for currency/theme/sign-out controls.
export function SiteNav({ extras }: { extras?: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  return (
    <nav className="nav">
      <Link to="/" className="logo" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="logo-icon">MI</div>
        <span>Market Intelligence</span>
      </Link>
      <div className="nav-actions">
        <Link to="/" className="nav-btn" activeOptions={{ exact: true }}>{t("nav.home")}</Link>
        <Link to="/value" className="nav-btn">{t("nav.marketing.value")}</Link>
        <Link to="/pricing" className="nav-btn">{t("nav.marketing.pricing")}</Link>
        <Link to="/about" className="nav-btn">{t("nav.marketing.about")}</Link>
        {signedIn && <Link to="/app" className="nav-btn">{t("nav.app")}</Link>}
        {extras ? (
          extras
        ) : (
          <>
            <button className="nav-btn" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>{t("nav.language")}</button>
            {!signedIn && <Link to="/auth" className="nav-btn primary">{t("nav.start")}</Link>}
          </>
        )}
      </div>
    </nav>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <div className="footer">
      <div>{t("footer.tagline")}</div>
      <div style={{ marginTop: "0.6rem", fontSize: "0.78rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link to="/terms" style={{ color: "var(--text3)" }}>{t("footer.terms")}</Link>
        <Link to="/privacy" style={{ color: "var(--text3)" }}>{t("footer.privacy")}</Link>
        <Link to="/about" style={{ color: "var(--text3)" }}>{t("nav.marketing.about")}</Link>
      </div>
    </div>
  );
}
