// Live currency rates provider.
// - Fetches USD-base rates from open.er-api.com (free, no key). Unlike the ECB
//   feed, it publishes EGP, SAR and AED, which this app needs.
// - Caches in localStorage for 24h.
// - On failure, silently falls back to the bundled defaults in currency.ts.
// - Exposes `updatedAt` via context so UI can show "Rates last updated: X".
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { setCurrencyRates, type Currency } from "./currency";

const SYMBOLS: Exclude<Currency, "USD">[] = ["EGP", "SAR", "AED", "GBP", "EUR"];
const CACHE_KEY = "mis_rates_v2";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedRates {
  rates: Record<string, number>;
  updatedAt: number;
}

interface RatesCtx {
  updatedAt: number | null;
  loading: boolean;
  source: "live" | "cache" | "fallback";
}

const Ctx = createContext<RatesCtx>({ updatedAt: null, loading: true, source: "fallback" });

async function fetchLiveRates(): Promise<{ rates: Record<string, number>; updatedAt: number } | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_unix?: number;
    };
    if (data.result !== "success" || !data.rates) return null;
    const picked: Record<string, number> = { USD: 1 };
    for (const code of SYMBOLS) {
      const value = data.rates[code];
      if (typeof value === "number" && Number.isFinite(value) && value > 0) picked[code] = value;
    }
    if (Object.keys(picked).length === 1) return null;
    const updatedAt = data.time_last_update_unix ? data.time_last_update_unix * 1000 : Date.now();
    return { rates: picked, updatedAt };
  } catch {
    return null;
  }
}


export function RatesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RatesCtx>({ updatedAt: null, loading: true, source: "fallback" });

  useEffect(() => {
    let cancelled = false;
    const apply = (rates: Record<string, number>, updatedAt: number, source: "live" | "cache") => {
      setCurrencyRates(rates);
      if (!cancelled) setState({ updatedAt, loading: false, source });
    };

    // 1. Try cache first for instant paint.
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as CachedRates;
        const fresh = Date.now() - cached.updatedAt < CACHE_TTL_MS;
        apply(cached.rates, cached.updatedAt, "cache");
        if (fresh) return () => { cancelled = true; }; // no refetch needed
      }
    } catch {
      /* corrupt cache, ignore */
    }

    // 2. Fetch live and update cache.
    fetchLiveRates().then((live) => {
      if (cancelled) return;
      if (!live) {
        // Only mark as fallback if we didn't already load from cache.
        setState((s) => (s.source === "cache" ? s : { ...s, loading: false }));
        return;
      }
      const payload: CachedRates = { rates: live, updatedAt: Date.now() };
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(payload)); } catch { /* ignore */ }
      apply(live, payload.updatedAt, "live");
    });

    return () => { cancelled = true; };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useRates() {
  return useContext(Ctx);
}
