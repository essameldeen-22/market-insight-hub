import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
} from "chart.js";
import { useI18n } from "@/i18n/context";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { useRates } from "@/lib/rates";
import { identify, track } from "@/lib/posthog";
import { deleteMyAccount } from "@/lib/account.functions";
import { SiteNav } from "@/components/SiteNav";
import { OnboardingTour } from "@/components/OnboardingTour";
import { CompetitorAnalysis } from "@/components/dashboard/CompetitorAnalysis";
import { SaasAudit } from "@/components/dashboard/SaasAudit";
import { PricingCalculator } from "@/components/dashboard/PricingCalculator";
import { RoiCalculator } from "@/components/dashboard/RoiCalculator";
import { ValueProp } from "@/components/dashboard/ValueProp";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler, Title);

type ModuleKey = "competitor" | "saas" | "pricing" | "roi" | "vp";

export function DashboardApp() {
  const { t, lang, setLang } = useI18n();
  const [active, setActive] = useState<ModuleKey>("competitor");
  const [currency, setCurrency] = useState<Currency>(() => (typeof window !== "undefined" && (localStorage.getItem("mis_currency") as Currency)) || "USD");
  const [theme, setTheme] = useState<"dark" | "light" | "auto">(() => (typeof window !== "undefined" && (localStorage.getItem("mis_theme") as "dark" | "light" | "auto")) || "dark");

  useEffect(() => {
    if (typeof document === "undefined") return;
    const apply = () => {
      const resolved = theme === "auto"
        ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
        : theme;
      document.body.classList.toggle("light-mode", resolved === "light");
    };
    apply();
    localStorage.setItem("mis_theme", theme);
    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("mis_currency", currency); }, [currency]);

  useEffect(() => {
    // Identify user for PostHog once mounted.
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getUser();
      if (data.user) identify(data.user.id, { email: data.user.email });
    })();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const keys: Record<string, ModuleKey> = { "1": "competitor", "2": "saas", "3": "pricing", "4": "roi", "5": "vp" };
      const k = keys[e.key];
      if (k) { e.preventDefault(); setActive(k); track("dashboard_module_switch", { module: k, method: "keyboard" }); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const signOut = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const deleteAcct = useServerFn(deleteMyAccount);
  const [deleting, setDeleting] = useState(false);
  const runDelete = async () => {
    if (!window.confirm(`${t("delete.confirm_title")}\n\n${t("delete.confirm_body")}`)) return;
    setDeleting(true);
    try {
      await deleteAcct();
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (e) {
      setDeleting(false);
      window.alert(t("delete.error") + (e instanceof Error ? `\n${e.message}` : ""));
    }
  };

  const cards: { key: ModuleKey; icon: string; klass: string; title: string; desc: string; badge: string; shortcut: string }[] = [
    { key: "competitor", icon: "📊", klass: "purple", title: t("cards.competitor.title"), desc: t("cards.competitor.desc"), badge: t("cards.competitor.badge"), shortcut: "Alt+1" },
    { key: "saas", icon: "💼", klass: "orange", title: t("cards.saas.title"), desc: t("cards.saas.desc"), badge: t("cards.saas.badge"), shortcut: "Alt+2" },
    { key: "pricing", icon: "💰", klass: "green", title: t("cards.pricing.title"), desc: t("cards.pricing.desc"), badge: t("cards.pricing.badge"), shortcut: "Alt+3" },
    { key: "roi", icon: "📈", klass: "blue", title: t("cards.roi.title"), desc: t("cards.roi.desc"), badge: t("cards.roi.badge"), shortcut: "Alt+4" },
    { key: "vp", icon: "🎯", klass: "purple", title: t("cards.vp.title"), desc: t("cards.vp.desc"), badge: t("cards.vp.badge"), shortcut: "Alt+5" },
  ];

  const rates = useRates();
  const ratesTs = rates.updatedAt
    ? new Date(rates.updatedAt).toLocaleDateString(lang === "ar" ? "ar-EG-u-nu-latn" : "en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
  const ratesTitle = rates.loading ? t("rates.loading") : rates.source === "fallback" ? t("rates.fallback") : t("rates.updated", { ts: ratesTs });

  const extras = (
    <span id="tour-controls" style={{ display: "contents" }}>
      <select className="nav-btn" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} title={ratesTitle}>
        {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
      </select>
      <span style={{ fontSize: "0.68rem", color: "var(--text3)", padding: "0 0.25rem" }} title={ratesTitle}>
        {rates.loading ? "…" : rates.source === "fallback" ? "≈" : ratesTs}
      </span>
      <select className="nav-btn" value={theme} onChange={(e) => setTheme(e.target.value as "dark" | "light" | "auto")} title={t("nav.theme")}>
        <option value="dark">🌙 {t("theme.dark")}</option>
        <option value="light">☀️ {t("theme.light")}</option>
        <option value="auto">🖥️ {t("theme.auto")}</option>
      </select>
      <button className="nav-btn" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>{t("nav.language")}</button>
      <button className="nav-btn" onClick={signOut}>{t("nav.signout")}</button>
      <button className="nav-btn" onClick={runDelete} disabled={deleting} style={{ color: "var(--danger)" }}>
        {deleting ? t("delete.deleting") : `🗑 ${t("nav.delete_account")}`}
      </button>
    </span>
  );

  const setModule = (k: ModuleKey) => {
    setActive(k);
    track("dashboard_module_switch", { module: k, method: "click" });
  };

  return (
    <>
      <div className="bg-mesh" />
      <SiteNav extras={extras} />

      <div className={firstRun ? "first-run" : undefined}>
      <section className="hero" style={{ paddingBottom: "1.5rem" }}>
        <div className="badge"><span className="badge-dot" />{t("hero.badge")}</div>
        <h1><span>{t("hero.title.a")}</span> {t("hero.title.b")}</h1>
      </section>


      <div className="tools-grid" id="tour-tools">
        {cards.map((c) => (
          <div key={c.key} className={`tool-card ${active === c.key ? "active" : ""}`} onClick={() => setModule(c.key)}>
            <div className={`tool-icon ${c.klass}`}>{c.icon}</div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
              <span className="tool-badge">{c.badge}</span>
              <span className="tool-badge" style={{ fontFamily: "monospace" }}>{c.shortcut}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={`app-panel ${active === "competitor" ? "active" : ""}`}>{active === "competitor" && <CompetitorAnalysis />}</div>
      <div className={`app-panel ${active === "saas" ? "active" : ""}`}>{active === "saas" && <SaasAudit currency={currency} />}</div>
      <div className={`app-panel ${active === "pricing" ? "active" : ""}`}>{active === "pricing" && <PricingCalculator currency={currency} />}</div>
      <div className={`app-panel ${active === "roi" ? "active" : ""}`}>{active === "roi" && <RoiCalculator currency={currency} />}</div>
      <div className={`app-panel ${active === "vp" ? "active" : ""}`}>{active === "vp" && <ValueProp />}</div>

      <OnboardingTour />

      <div className="footer">{t("footer.tagline")}</div>
    </>
  );
}
