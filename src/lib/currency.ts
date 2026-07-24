// Multi-currency display. USD is the base. The rates below are static
// fallbacks used before live rates load (or if the live-rate fetch fails).
// `setCurrencyRates` is called by `RatesProvider` in src/lib/rates.tsx after
// pulling live rates from api.frankfurter.dev with a 24h client-side cache.

export type Currency = "USD" | "EGP" | "SAR" | "AED" | "GBP" | "EUR";

export const CURRENCIES: { code: Currency; label: string; symbol: string; rate: number }[] = [
  { code: "USD", label: "US Dollar", symbol: "$", rate: 1 },
  { code: "EGP", label: "Egyptian Pound", symbol: "E£", rate: 48.5 },
  { code: "SAR", label: "Saudi Riyal", symbol: "﷼", rate: 3.75 },
  { code: "AED", label: "UAE Dirham", symbol: "د.إ", rate: 3.67 },
  { code: "GBP", label: "British Pound", symbol: "£", rate: 0.79 },
  { code: "EUR", label: "Euro", symbol: "€", rate: 0.92 },
];

// Mutable module-level cache. Starts populated with the bundled fallbacks so
// formatMoney is always safe to call, even before live rates load or in SSR.
let currentRates: Record<string, number> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c.rate]),
);

export function setCurrencyRates(rates: Record<string, number>) {
  currentRates = { ...currentRates, ...rates };
}

export function getCurrencyRate(currency: Currency): number {
  return currentRates[currency] ?? CURRENCIES.find((c) => c.code === currency)?.rate ?? 1;
}

export function formatMoney(usdAmount: number, currency: Currency = "USD"): string {
  const cfg = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const rate = currentRates[currency] ?? cfg.rate;
  const converted = usdAmount * rate;
  const rounded = Math.round(converted);
  const withCommas = new Intl.NumberFormat("en-US", {
    numberingSystem: "latn",
    maximumFractionDigits: 0,
  }).format(rounded);
  return `${cfg.symbol}${withCommas}`;
}
