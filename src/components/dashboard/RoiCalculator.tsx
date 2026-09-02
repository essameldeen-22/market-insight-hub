import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Line } from "react-chartjs-2";
import { useI18n } from "@/i18n/context";
import { formatMoney, type Currency } from "@/lib/currency";
import { loadRoiState, saveRoiState, type RoiState } from "@/lib/persistence.functions";
import { Card, exportElementToPdf, exportToCsv, fmtPct, useDebouncedEffect } from "./shared";
import { AnimatedValue } from "./Animated";

export function RoiCalculator({ currency }: { currency: Currency }) {
  const { t } = useI18n();
  const load = useServerFn(loadRoiState);
  const save = useServerFn(saveRoiState);
  const [state, setState] = useState<RoiState>({ initial: 0, monthly: 0, savings: 0, revenue: 0, period: 12 });
  const [confidence, setConfidence] = useState(30); // % swing for scenarios
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    load().then((s) => { if (s && Object.keys(s).length) setState((prev) => ({ ...prev, ...s })); setHydrated(true); }).catch(() => setHydrated(true));
  }, [load]);
  useDebouncedEffect(() => { if (hydrated) save({ data: { state } }).catch(() => {}); }, [state, hydrated]);

  const totalCost = state.initial + state.monthly * state.period;
  const totalGain = (state.savings + state.revenue) * state.period;
  const net = totalGain - totalCost;
  const roiPct = totalCost > 0 ? (net / totalCost) * 100 : 0;

  const scenarios = useMemo(() => {
    const c = confidence / 100;
    const build = (mult: number) => {
      const savings = state.savings * mult;
      const revenue = state.revenue * mult;
      const monthlyNet = savings + revenue - state.monthly;
      const beMonth = monthlyNet > 0 ? Math.ceil(state.initial / monthlyNet) : 0;
      return { mult, monthlyNet, beMonth };
    };
    return {
      optimistic: build(1 + c),
      realistic: build(1),
      pessimistic: build(Math.max(0, 1 - c)),
    };
  }, [state, confidence]);

  const chartData = useMemo(() => {
    const labels: string[] = [];
    const cost: number[] = [];
    const gainOpt: number[] = [];
    const gainReal: number[] = [];
    const gainPess: number[] = [];
    for (let m = 1; m <= state.period; m++) {
      labels.push(`${t("panels.roi.month")} ${m}`);
      cost.push(state.initial + state.monthly * m);
      gainOpt.push((state.savings + state.revenue) * scenarios.optimistic.mult * m);
      gainReal.push((state.savings + state.revenue) * m);
      gainPess.push((state.savings + state.revenue) * scenarios.pessimistic.mult * m);
    }
    return {
      labels,
      datasets: [
        { label: t("panels.roi.chart_cost"), data: cost, borderColor: "#e5674e", backgroundColor: "rgba(229,103,78,0.12)", fill: true, tension: 0.35 },
        { label: t("panels.roi.scenario_optimistic"), data: gainOpt, borderColor: "#4fb286", backgroundColor: "rgba(79,178,134,0.12)", fill: false, tension: 0.35, borderDash: [4, 4] },
        { label: t("panels.roi.scenario_realistic"), data: gainReal, borderColor: "#f2a63b", backgroundColor: "rgba(242,166,59,0.15)", fill: false, tension: 0.35 },
        { label: t("panels.roi.scenario_pessimistic"), data: gainPess, borderColor: "#4fc3d9", backgroundColor: "rgba(79,195,217,0.12)", fill: false, tension: 0.35, borderDash: [4, 4] },
      ],
    };
  }, [state, scenarios, t]);

  const reportRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const doExportPdf = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try { await exportElementToPdf(reportRef.current, "roi-calculator.pdf"); }
    finally { setExporting(false); }
  };
  const doExportCsv = () => {
    const rows: (string | number)[][] = [
      ["Metric", "Value"],
      ["Initial cost", state.initial],
      ["Monthly cost", state.monthly],
      ["Monthly savings", state.savings],
      ["Monthly extra revenue", state.revenue],
      ["Period (months)", state.period],
      ["Confidence swing %", confidence],
      ["Total cost", totalCost],
      ["Total gain (realistic)", totalGain],
      ["Net (realistic)", net],
      ["ROI %", roiPct],
      [],
      ["Scenario", "Monthly net", "Break-even month"],
      ["Optimistic", scenarios.optimistic.monthlyNet, scenarios.optimistic.beMonth],
      ["Realistic", scenarios.realistic.monthlyNet, scenarios.realistic.beMonth],
      ["Pessimistic", scenarios.pessimistic.monthlyNet, scenarios.pessimistic.beMonth],
    ];
    exportToCsv("roi-calculator.csv", rows);
  };

  const scenarioRows: { key: "optimistic" | "realistic" | "pessimistic"; label: string; color: string }[] = [
    { key: "optimistic", label: t("panels.roi.scenario_optimistic"), color: "var(--success)" },
    { key: "realistic", label: t("panels.roi.scenario_realistic"), color: "var(--accent)" },
    { key: "pessimistic", label: t("panels.roi.scenario_pessimistic"), color: "var(--warning)" },
  ];

  return (
    <div ref={reportRef}>
      <div className="panel-header">
        <h2><span className="icon-lead">📊</span> {t("panels.roi.h2")}</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn btn-outline btn-sm" onClick={() => setState({ initial: 0, monthly: 0, savings: 0, revenue: 0, period: 12 })}>{t("panels.roi.reset")}</button>
          <button className="btn btn-outline btn-sm" onClick={doExportPdf} disabled={exporting}>📄 {exporting ? "…" : t("actions.export_pdf")}</button>
          <button className="btn btn-outline btn-sm" onClick={doExportCsv}>📊 {t("actions.export_csv")}</button>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="left-col">
          <Card title={<><span className="icon-lead">💵</span> {t("panels.roi.costs_title")}</>}>
            {[
              { key: "initial", label: t("panels.roi.initial") },
              { key: "monthly", label: t("panels.roi.monthly") },
              { key: "savings", label: t("panels.roi.savings") },
              { key: "revenue", label: t("panels.roi.revenue") },
              { key: "period", label: t("panels.roi.period") },
            ].map((f) => (
              <div key={f.key} className="input-group">
                <label>{f.label}</label>
                <input className="input-field" type="number" min="0" lang="en" value={(state as never)[f.key] || ""} onChange={(e) => setState((s) => ({ ...s, [f.key]: Number(e.target.value) || 0 }))} />
              </div>
            ))}
            <div className="input-group">
              <label>{t("panels.roi.confidence")}: <strong>±{fmtPct(confidence, 0)}%</strong></label>
              <input type="range" min={5} max={70} step={5} lang="en" value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} />
              <div style={{ fontSize: "0.7rem", color: "var(--text3)", marginTop: "0.25rem" }}>{t("panels.roi.confidence_hint")}</div>
            </div>
          </Card>

          <Card title={<><span className="icon-lead">💡</span> {t("panels.roi.break_even_title")}</>}>
            <div className="stats-grid">
              {scenarioRows.map((s) => {
                const sc = scenarios[s.key];
                const beText = sc.beMonth > 0 && sc.beMonth <= state.period
                  ? t("panels.roi.be_month", { n: sc.beMonth })
                  : t("panels.roi.be_none");
                return (
                  <div key={s.key} className="stat-card">
                    <div className="stat-label" style={{ color: s.color }}>{s.label}</div>
                    <div className="stat-value" style={{ fontSize: "1.05rem", color: s.color }}>{beText}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text3)" }}>{t("panels.roi.net_monthly", { money: formatMoney(sc.monthlyNet, currency) })}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
        <div className="right-col">
          <Card title={<><span className="icon-lead">📊</span> {t("panels.roi.results_title")}</>}>
            <div className="roi-grid">
              <div className="roi-result"><div className="num" style={{ color: "var(--danger)" }}><AnimatedValue value={totalCost} format={(n) => formatMoney(n, currency)} /></div><div className="lbl">{t("panels.roi.total_cost")}</div></div>
              <div className="roi-result"><div className="num" style={{ color: "var(--success)" }}><AnimatedValue value={totalGain} format={(n) => formatMoney(n, currency)} /></div><div className="lbl">{t("panels.roi.total_gain")}</div></div>
              <div className="roi-result"><div className="num" style={{ color: net >= 0 ? "var(--success)" : "var(--danger)" }}><AnimatedValue value={net} format={(n) => formatMoney(n, currency)} /></div><div className="lbl">{t("panels.roi.net")}</div></div>
              <div className="roi-result"><div className="num"><AnimatedValue value={roiPct} format={(n) => `${fmtPct(n, 1)}%`} /></div><div className="lbl">{t("panels.roi.percent")}</div></div>
            </div>
          </Card>
          {state.period > 0 && (
            <Card>
              <div style={{ height: 280 }}>
                <Line data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { labels: { color: "#9aa5ad", font: { size: 11 } } } }, scales: { x: { ticks: { color: "#9aa5ad", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } }, y: { ticks: { color: "#9aa5ad", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } } } }} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
