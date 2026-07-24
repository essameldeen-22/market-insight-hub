// Live currency rates provider.
// - Fetches USD-base rates from api.frankfurter.dev (free, no key).
// - Caches in localStorage for 24h.
// - On failure, silently falls back to the bundled defaults in currency.ts.
// - Exposes `updatedAt` via context so UI can show "Rates last updated: X".
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { setCurrencyRates, type Currency } from "./currency";

const SYMBOLS: Exclude<Currency, "USD">[] = ["EGP", "SAR", "AED", "GBP", "EUR"];
const CACHE_KEY = "mis_rates_v1";
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

async function fetchLiveRates(): Promise<Record<string, number> | null> {
  try {
    const url = `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${SYMBOLS.join(",")}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { rates?: Record<string, number> };
    if (!data.rates) return null;
    return { USD: 1, ...data.rates };
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
