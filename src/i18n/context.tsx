import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SUPPORTED_LANGS, TRANSLATIONS, tKey, type Lang } from "./dictionaries";

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: "rtl" | "ltr";
}

const Ctx = createContext<I18nCtx | null>(null);

function detectInitial(): Lang {
  if (typeof window === "undefined") return "ar";
  try {
    const saved = localStorage.getItem("mis_lang");
    if (saved && (SUPPORTED_LANGS as string[]).includes(saved)) return saved as Lang;
  } catch {
    /* storage disabled */
  }
  const nav = navigator.language?.slice(0, 2);
  return nav === "en" ? "en" : "ar";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // SSR renders "ar"; on hydration/mount we read the persisted value.
  const [lang, setLangState] = useState<Lang>("ar");
  const hydrated = useRef(false);

  // Re-read persisted language on EVERY mount (fixes lang reverting on route change).
  useEffect(() => {
    const detected = detectInitial();
    if (detected !== lang) setLangState(detected);
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    // Only persist AFTER hydration so the SSR default doesn't clobber saved value on mount.
    if (hydrated.current) {
      try { localStorage.setItem("mis_lang", lang); } catch { /* ignore */ }
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    hydrated.current = true;
    setLangState(l);
  }, []);
  const dict = TRANSLATIONS[lang];
  const t = useCallback((key: string, vars?: Record<string, string | number>) => tKey(dict, key, vars), [dict]);

  const value = useMemo<I18nCtx>(() => ({ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used within LanguageProvider");
  return c;
}
