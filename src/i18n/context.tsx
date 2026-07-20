import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
  const saved = localStorage.getItem("mis_lang");
  if (saved && (SUPPORTED_LANGS as string[]).includes(saved)) return saved as Lang;
  const nav = navigator.language?.slice(0, 2);
  if (nav === "en") return "en";
  return "ar";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    setLangState(detectInitial());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    localStorage.setItem("mis_lang", lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
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
