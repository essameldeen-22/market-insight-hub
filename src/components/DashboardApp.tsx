import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Doughnut, Line } from "react-chartjs-2";
import { useI18n } from "@/i18n/context";
import { CURRENCIES, formatMoney, type Currency } from "@/lib/currency";
import { findAlternative, SAAS_CATEGORIES } from "@/lib/saas-alts";
import { analyzeReviewsFn } from "@/lib/claude.functions";
import type { AnalysisResult } from "@/lib/claude.server";
import {
  loadSaasStack,
  saveSaasStack,
  loadPricingState,
  savePricingState,
  loadRoiState,
  saveRoiState,
  type SaasTool,
  type PricingState,
  type RoiState,
} from "@/lib/persistence.functions";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler, Title);

type ModuleKey = "competitor" | "saas" | "pricing" | "roi";

// --- Debounce helper -------------------------------------------------------
function useDebouncedEffect(effect: () => void, deps: unknown[], delay = 600) {
  useEffect(() => {
    const id = setTimeout(effect, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}

// --- Shared UI -------------------------------------------------------------
function Card({ title, children, right }: { title?: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="card">
      {(title || right) && (
        <div className="card-header">
          {title && <div className="card-title">{title}</div>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// --- Competitor Analysis ---------------------------------------------------
interface Competitor { id: string; name: string; reviews: string; result?: AnalysisResult; loading?: boolean; error?: string; }

function CompetitorAnalysis() {
  const { t, lang } = useI18n();
  const analyze = useServerFn(analyzeReviewsFn);
  const [products, setProducts] = useState<Competitor[]>([
    { id: crypto.randomUUID(), name: "", reviews: "" },
  ]);

  const runAnalyze = async (id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, loading: true, error: undefined } : p)));
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const reviews = target.reviews.split("\n").map((r) => r.trim()).filter(Boolean);
    if (reviews.length === 0) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, loading: false, error: t("panels.competitor.empty") } : p)));
      return;
    }
    try {
      const result = await analyze({ data: { productName: target.name, reviews } });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, result, loading: false } : p)));
    } catch (e) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, loading: false, error: e instanceof Error ? e.message : t("panels.competitor.error") } : p)),
      );
    }
  };

  const DEMO_AR = [
    "الصوت رائع جداً لكن البطارية ضعيفة بعد 3 شهور استخدام",
    "مريحة في الاستخدام لفترات طويلة، الجودة ممتازة",
    "الاتصال بينقطع كتير مع الموبايل، مشكلة كبيرة",
    "التصميم أنيق والصوت واضح جداً، أنصح بها",
    "السعر مرتفع مقابل جودة البناء البلاستيكية",
    "البطارية بتفضل شغالة يوم كامل بشحنة واحدة",
    "المقاس مناسب والعزل الصوتي ممتاز في الشارع",
    "خاصية إلغاء الضوضاء ضعيفة مقارنة بالسعر",
    "التوصيل سريع والتغليف احترافي جداً",
    "جودة الميكروفون في المكالمات متوسطة",
  ];
  const DEMO_EN = [
    "Battery lasts a full day on a single charge, love it",
    "Bluetooth keeps disconnecting when I move around",
    "Design is sleek and the fit is comfortable",
    "Sound quality is excellent for the price",
    "Build quality feels cheap for the price tag",
    "Noise cancellation is weaker than advertised",
    "Very comfortable for long listening sessions",
    "Microphone quality on calls is just average",
    "Fast shipping and premium packaging",
    "Price is too high for plastic build quality",
  ];
  const loadDemo = (id: string) => {
    const demo = (lang === "ar" ? DEMO_AR : DEMO_EN).join("\n");
    const sampleName = lang === "ar" ? "منتج تجريبي" : "Sample Product";
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, reviews: demo, name: p.name || sampleName } : p)));
  };


  return (
    <div>
      <div className="panel-header">
        <h2>
          <span className="icon-lead">📊</span> {t("panels.competitor.h2")}
        </h2>
        <button className="btn btn-outline btn-sm" onClick={() => setProducts((p) => [...p, { id: crypto.randomUUID(), name: "", reviews: "" }])}>
          + {t("panels.competitor.add_product")}
        </button>
      </div>

      {products.map((p, idx) => (
        <div key={p.id} className="dashboard-grid" style={{ marginBottom: "2rem" }}>
          <div className="left-col">
            <Card
              title={
                <>
                  <span className="icon-lead">✏️</span> {t("panels.competitor.input_title")} — {t("panels.competitor.product_n")} {idx + 1}
                </>
              }
              right={
                products.length > 1 && (
                  <button className="btn btn-outline btn-sm" onClick={() => setProducts((prev) => prev.filter((x) => x.id !== p.id))}>
                    {t("panels.competitor.remove_product")}
                  </button>
                )
              }
            >
              <div className="input-group">
                <label>{t("panels.competitor.product_label")}</label>
                <input className="input-field" value={p.name} onChange={(e) => setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))} placeholder={t("panels.competitor.product_placeholder")} />
              </div>
              <div className="input-group">
                <label>{t("panels.competitor.reviews_label")}</label>
                <textarea className="input-field" rows={8} value={p.reviews} onChange={(e) => setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, reviews: e.target.value } : x)))} placeholder={t("panels.competitor.reviews_placeholder")} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={() => runAnalyze(p.id)} disabled={p.loading}>
                  {p.loading ? t("panels.competitor.analyzing") : t("panels.competitor.analyze")}
                </button>
                <button className="btn btn-outline" onClick={() => loadDemo(p.id)} disabled={p.loading}>
                  {t("panels.competitor.demo")}
                </button>
              </div>
              {p.error && <div className="insight-box danger" style={{ marginTop: "1rem" }}>{p.error}</div>}
              {p.loading && (
                <div className="loading active">
                  <div className="spinner" />
                  <div style={{ color: "var(--text2)", fontSize: "0.9rem" }}>{t("panels.competitor.analyzing")}</div>
                </div>
              )}
            </Card>

            {p.result && (
              <>
                <Card title={<><span className="icon-lead">🔥</span> {t("panels.competitor.topics_title")}</>}>
                  <TopicsList topics={p.result.topics} />
                </Card>
                <Card title={<><span className="icon-lead">⚠️</span> {t("panels.competitor.pains_title")}</>}>
                  {p.result.pains.length === 0 && <div className="pain-desc">—</div>}
                  {p.result.pains.map((pain, i) => (
                    <div key={i} className="pain-card">
                      <div className="pain-title">🔴 {pain.title}</div>
                      <div className="pain-desc">{pain.description}</div>
                    </div>
                  ))}
                </Card>
                <Card title={<><span className="icon-lead">✅</span> {t("panels.competitor.strengths_title")}</>}>
                  {p.result.strengths.length === 0 && <div className="pain-desc">—</div>}
                  {p.result.strengths.map((s, i) => (
                    <div key={i} className="pain-card positive">
                      <div className="pain-title">🟢 {s.title}</div>
                      <div className="pain-desc">{s.description}</div>
                    </div>
                  ))}
                </Card>
              </>
            )}
          </div>
          <div className="right-col">
            {p.result ? (
              <>
                <Card title={<><span className="icon-lead">📈</span> {t("panels.competitor.stats_title")}</>}>
                  <SentimentStats result={p.result} />
                </Card>
                <Card title={<><span className="icon-lead">💡</span> {t("panels.competitor.insights_title")}</>}>
                  <InsightsList result={p.result} />
                </Card>
              </>
            ) : (
              <Card>
                <div style={{ padding: "1rem", textAlign: "center", color: "var(--text3)", fontSize: "0.85rem" }}>{t("panels.competitor.empty")}</div>
              </Card>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SentimentStats({ result }: { result: AnalysisResult }) {
  const { t } = useI18n();
  const total = result.totalReviews || 1;
  const s = result.sentiment;
  const rows: [string, number, string][] = [
    [t("panels.competitor.stat_total"), result.totalReviews, "var(--text)"],
    [t("panels.competitor.stat_pos"), s.positive, "var(--success)"],
    [t("panels.competitor.stat_neg"), s.negative, "var(--danger)"],
    [t("panels.competitor.stat_mix"), s.mixed, "var(--warning)"],
    [t("panels.competitor.stat_neu"), s.neutral, "var(--text2)"],
  ];
  return (
    <>
      <div className="stats-grid">
        {rows.map(([label, val, color]) => (
          <div key={label} className="stat-card">
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--text3)", marginBottom: "0.4rem" }}>{t("panels.competitor.dist_label")}</div>
      <div className="sentiment-bar">
        {(["positive", "negative", "mixed", "neutral"] as const).map((k) => {
          const pct = (s[k] / total) * 100;
          if (pct < 1) return null;
          const bg = k === "positive" ? "var(--success)" : k === "negative" ? "var(--danger)" : k === "mixed" ? "var(--warning)" : "var(--text3)";
          return <div key={k} className="sentiment-segment" style={{ width: `${pct}%`, background: bg }}>{Math.round(pct)}%</div>;
        })}
      </div>
    </>
  );
}

function TopicsList({ topics }: { topics: AnalysisResult["topics"] }) {
  const { t } = useI18n();
  const max = Math.max(1, ...topics.map((x) => x.count));
  const leanText: Record<string, string> = {
    strength: t("panels.competitor.lean_strength"),
    pain: t("panels.competitor.lean_pain"),
    split: t("panels.competitor.lean_split"),
    neutral: t("panels.competitor.lean_neutral"),
  };
  return (
    <>
      {topics.map((topic, i) => (
        <div key={topic.topic + i} className="topic-item">
          <div className="topic-rank">{i + 1}</div>
          <div className="topic-info">
            <div className="topic-name">{topic.topic} <span style={{ fontSize: "0.7rem", color: "var(--text3)", marginInlineStart: "0.5rem" }}>{leanText[topic.lean]}</span></div>
            <div className="topic-bar-bg"><div className="topic-bar-fill" style={{ width: `${(topic.count / max) * 100}%` }} /></div>
          </div>
          <div className="topic-count">{topic.count} {t("panels.competitor.mentions")}</div>
        </div>
      ))}
    </>
  );
}

function InsightsList({ result }: { result: AnalysisResult }) {
  const { t } = useI18n();
  const total = result.totalReviews || 1;
  const negPct = (result.sentiment.negative / total) * 100;
  const posPct = (result.sentiment.positive / total) * 100;
  const mixPct = (result.sentiment.mixed / total) * 100;
  const insights: { kind: string; text: string }[] = [];
  if (negPct > 40) insights.push({ kind: "danger", text: t("panels.competitor.insight_high_neg") });
  if (posPct > 60) insights.push({ kind: "success", text: t("panels.competitor.insight_loved") });
  if (result.topics[0]) insights.push({ kind: "warn", text: t("panels.competitor.insight_top_topic", { topic: result.topics[0].topic }) });
  if (result.pains.length > 0) insights.push({ kind: "info", text: t("panels.competitor.insight_pains", { n: result.pains.length }) });
  if (mixPct > 25) insights.push({ kind: "warn", text: t("panels.competitor.insight_mixed") });
  if (insights.length === 0) insights.push({ kind: "info", text: t("panels.competitor.insight_neutral") });
  return (
    <>
      {insights.map((ins, i) => (
        <div key={i} className={`insight-box ${ins.kind}`}>{ins.text}</div>
      ))}
    </>
  );
}

// --- SaaS Audit ------------------------------------------------------------
function SaasAudit({ currency }: { currency: Currency }) {
  const { t } = useI18n();
  const load = useServerFn(loadSaasStack);
  const save = useServerFn(saveSaasStack);
  const [tools, setTools] = useState<SaasTool[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    load().then((rows) => {
      setTools(rows.length ? rows : [{ id: crypto.randomUUID(), name: "", category: "", cost: 0, users: 1, usage: 100 }]);
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, [load]);

  useDebouncedEffect(() => {
    if (!hydrated) return;
    save({ data: { tools } }).catch(() => {});
  }, [tools, hydrated]);

  const update = (id: string, patch: Partial<SaasTool>) =>
    setTools((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const remove = (id: string) => setTools((prev) => prev.filter((x) => x.id !== id));
  const add = () => setTools((prev) => [...prev, { id: crypto.randomUUID(), name: "", category: "", cost: 0, users: 1, usage: 100 }]);
  const clear = () => setTools([]);
  const demo = () => setTools([
    { id: crypto.randomUUID(), name: "Salesforce", category: "CRM", cost: 150, users: 10, usage: 60 },
    { id: crypto.randomUUID(), name: "Slack", category: "Communication", cost: 8, users: 25, usage: 95 },
    { id: crypto.randomUUID(), name: "Figma", category: "Design", cost: 15, users: 5, usage: 80 },
    { id: crypto.randomUUID(), name: "Zoom", category: "Communication", cost: 20, users: 15, usage: 45 },
    { id: crypto.randomUUID(), name: "Notion", category: "Project Management", cost: 10, users: 20, usage: 70 },
    { id: crypto.randomUUID(), name: "Mailchimp", category: "Marketing", cost: 50, users: 3, usage: 30 },
  ]);

  const stats = useMemo(() => {
    let annual = 0;
    let savings = 0;
    let waste = 0;
    let topCost = { name: "", value: 0 };
    let lowUse = { name: "", pct: 100 };
    let migratable = 0;
    for (const t of tools) {
      const monthly = (t.cost || 0) * (t.users || 1);
      const yearly = monthly * 12;
      annual += yearly;
      const alt = findAlternative(t.name);
      if (alt) {
        migratable += 1;
        savings += yearly * alt.save;
      }
      if (yearly > topCost.value) topCost = { name: t.name || "—", value: yearly };
      if ((t.usage ?? 100) < lowUse.pct && t.name) lowUse = { name: t.name, pct: t.usage ?? 0 };
      waste += yearly * (1 - (t.usage ?? 100) / 100);
    }
    return { annual, savings, waste, topCost, lowUse, migratable };
  }, [tools]);

  const catData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tools) {
      if (!t.name) continue;
      const yearly = (t.cost || 0) * (t.users || 1) * 12;
      const cat = t.category || "Other";
      map.set(cat, (map.get(cat) ?? 0) + yearly);
    }
    return {
      labels: Array.from(map.keys()),
      datasets: [{
        data: Array.from(map.values()),
        backgroundColor: ["#6366f1", "#a855f7", "#f59e0b", "#22c55e", "#3b82f6", "#ef4444", "#06b6d4", "#84cc16", "#ec4899", "#8b5cf6"],
        borderWidth: 0,
      }],
    };
  }, [tools]);

  const migrations = useMemo(() => tools.filter((t) => t.name).map((t) => ({ tool: t, alt: findAlternative(t.name) })).filter((x) => x.alt), [tools]);

  const insights = useMemo(() => {
    const out: { kind: string; text: string }[] = [];
    if (stats.topCost.value > 0) out.push({ kind: "warn", text: t("panels.saas.insight_top_cost", { name: stats.topCost.name, money: formatMoney(stats.topCost.value, currency) }) });
    if (stats.lowUse.name && stats.lowUse.pct < 50) out.push({ kind: "danger", text: t("panels.saas.insight_low_use", { name: stats.lowUse.name, pct: Math.round(stats.lowUse.pct) }) });
    if (stats.migratable > 0) out.push({ kind: "success", text: t("panels.saas.insight_ready", { n: stats.migratable, total: tools.filter((x) => x.name).length }) });
    if (stats.savings > 0 && stats.annual > 0) out.push({ kind: "info", text: t("panels.saas.insight_savings", { pct: Math.round((stats.savings / stats.annual) * 100), money: formatMoney(stats.savings, currency) }) });
    if (stats.waste > 0) out.push({ kind: "warn", text: t("panels.saas.insight_waste", { money: formatMoney(stats.waste, currency) }) });
    return out;
  }, [stats, tools, currency, t]);

  return (
    <>
      <div className="panel-header">
        <h2><span className="icon-lead">💼</span> {t("panels.saas.h2")}</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-outline btn-sm" onClick={demo}>{t("panels.saas.demo")}</button>
          <button className="btn btn-outline btn-sm" onClick={clear}>{t("panels.saas.clear")}</button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="left-col">
          <Card title={<><span className="icon-lead">🛠️</span> {t("panels.saas.tools_title")}</>}>
            <div className="tool-row-grid header">
              <div>{t("panels.saas.header_name")}</div>
              <div>{t("panels.saas.header_cat")}</div>
              <div>{t("panels.saas.header_cost")}</div>
              <div>{t("panels.saas.header_users")}</div>
              <div>{t("panels.saas.header_usage")}</div>
              <div></div>
            </div>
            {tools.map((tool) => (
              <div key={tool.id} className="tool-row">
                <input value={tool.name} onChange={(e) => update(tool.id, { name: e.target.value })} placeholder="Slack" />
                <select value={tool.category} onChange={(e) => update(tool.id, { category: e.target.value })}>
                  <option value="">{t("panels.saas.pick_cat")}</option>
                  {SAAS_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input type="number" min="0" value={tool.cost || ""} onChange={(e) => update(tool.id, { cost: Number(e.target.value) || 0 })} lang="en" />
                <input type="number" min="0" value={tool.users || ""} onChange={(e) => update(tool.id, { users: Number(e.target.value) || 0 })} lang="en" />
                <input type="number" min="0" max="100" value={tool.usage ?? 100} onChange={(e) => update(tool.id, { usage: Number(e.target.value) || 0 })} lang="en" />
                <button className="remove-btn" onClick={() => remove(tool.id)}>✕</button>
              </div>
            ))}
            <button className="add-btn" onClick={add}>+ {t("panels.saas.add_row")}</button>
          </Card>

          <Card title={<><span className="icon-lead">🔄</span> {t("panels.saas.migration_title")}</>}>
            {migrations.length === 0 ? (
              <div style={{ color: "var(--text3)", fontSize: "0.85rem", textAlign: "center", padding: "1rem" }}>{t("panels.saas.migration_empty")}</div>
            ) : (
              <>
                {migrations.map(({ tool, alt }) => {
                  if (!alt) return null;
                  const yearly = (tool.cost || 0) * (tool.users || 1) * 12;
                  const save = yearly * alt.save;
                  return (
                    <div key={tool.id} className="migration-item">
                      <div className="mi-icon">🔄</div>
                      <div className="info">
                        <div><span className="from">{tool.name}</span><span className="arrow"> → </span><span className="to">{alt.to}</span></div>
                        <div className="save">{t("panels.saas.save_per_year", { money: formatMoney(save, currency) })}</div>
                      </div>
                      <span className={`mig-badge ${alt.difficulty}`}>{alt.difficulty}</span>
                    </div>
                  );
                })}
                <div className="insight-box info" style={{ marginTop: "1rem", fontSize: "0.75rem" }}>{t("panels.saas.savings_note")}</div>
              </>
            )}
          </Card>
        </div>

        <div className="right-col">
          <div className="summary-card">
            <div className="label">{t("panels.saas.total_annual")}</div>
            <div className="value">{formatMoney(stats.annual, currency)}</div>
            {stats.savings > 0 && (
              <div className="savings">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.7rem", opacity: 0.85 }}>{t("panels.saas.potential_savings")}</div>
                  <div className="amount">{formatMoney(stats.savings, currency)}</div>
                </div>
              </div>
            )}
          </div>

          {catData.labels.length > 0 && (
            <Card title={<><span className="icon-lead">📊</span> {t("panels.saas.chart_title")}</>}>
              <div className="chart-container" style={{ height: 220 }}>
                <Doughnut data={catData} options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: "#a1a1aa", font: { size: 10 } } } } }} />
              </div>
            </Card>
          )}

          {insights.length > 0 && (
            <Card title={<><span className="icon-lead">💡</span> {t("panels.saas.insights_title")}</>}>
              {insights.map((i, idx) => <div key={idx} className={`insight-box ${i.kind}`}>{i.text}</div>)}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

// --- Pricing Calculator ---------------------------------------------------
function PricingCalculator({ currency }: { currency: Currency }) {
  const { t } = useI18n();
  const load = useServerFn(loadPricingState);
  const save = useServerFn(savePricingState);
  const [state, setState] = useState<PricingState>({ cost: 0, customers: 0, competitor: 0, margin: 30, model: "subscription" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    load().then((s) => { if (s && Object.keys(s).length) setState((prev) => ({ ...prev, ...s })); setHydrated(true); }).catch(() => setHydrated(true));
  }, [load]);
  useDebouncedEffect(() => { if (hydrated) save({ data: { state } }).catch(() => {}); }, [state, hydrated]);

  const optimal = useMemo(() => {
    if (state.customers === 0) return 0;
    const raw = (state.cost / state.customers) * (1 + state.margin / 100);
    return Math.round(raw / 5) * 5;
  }, [state]);
  const revenue = optimal * state.customers;
  const profit = revenue - state.cost;
  const annual = revenue * 12;
  const breakEven = optimal > 0 ? Math.ceil(state.cost / optimal) : 0;
  const diff = state.competitor > 0 ? ((optimal - state.competitor) / state.competitor) * 100 : 0;

  const modelLabel = state.model === "subscription" ? t("panels.pricing.model_lbl_sub") : state.model === "onetime" ? t("panels.pricing.model_lbl_one") : t("panels.pricing.model_lbl_free");

  const insights: { kind: string; text: string }[] = [];
  if (state.competitor > 0) {
    if (diff < -10) insights.push({ kind: "success", text: t("panels.pricing.ins_lower") });
    else if (diff > 20) insights.push({ kind: "warn", text: t("panels.pricing.ins_higher") });
    else insights.push({ kind: "info", text: t("panels.pricing.ins_mid") });
  }
  if (state.margin < 20) insights.push({ kind: "warn", text: t("panels.pricing.ins_lowmargin") });
  if (breakEven > state.customers) insights.push({ kind: "danger", text: t("panels.pricing.ins_high_be") });

  return (
    <>
      <div className="panel-header">
        <h2><span className="icon-lead">💰</span> {t("panels.pricing.h2")}</h2>
        <button className="btn btn-outline btn-sm" onClick={() => setState({ cost: 0, customers: 0, competitor: 0, margin: 30, model: "subscription" })}>{t("panels.pricing.reset")}</button>
      </div>
      <div className="dashboard-grid">
        <div className="left-col">
          <Card title={<><span className="icon-lead">⚙️</span> {t("panels.pricing.criteria_title")}</>}>
            {[
              { key: "cost", label: t("panels.pricing.cost") },
              { key: "customers", label: t("panels.pricing.customers") },
              { key: "competitor", label: t("panels.pricing.competitor") },
              { key: "margin", label: t("panels.pricing.margin") },
            ].map((f) => (
              <div key={f.key} className="input-group">
                <label>{f.label}</label>
                <input className="input-field" type="number" min="0" lang="en" value={(state as never)[f.key] || ""} onChange={(e) => setState((s) => ({ ...s, [f.key]: Number(e.target.value) || 0 }))} />
              </div>
            ))}
            <div className="input-group">
              <label>{t("panels.pricing.model")}</label>
              <select className="input-field" value={state.model} onChange={(e) => setState((s) => ({ ...s, model: e.target.value as PricingState["model"] }))}>
                <option value="subscription">{t("panels.pricing.model_sub")}</option>
                <option value="onetime">{t("panels.pricing.model_one")}</option>
                <option value="freemium">{t("panels.pricing.model_free")}</option>
              </select>
            </div>
          </Card>

          {insights.length > 0 && (
            <Card title={<><span className="icon-lead">💡</span> {t("panels.pricing.recs_title")}</>}>
              {insights.map((i, idx) => <div key={idx} className={`insight-box ${i.kind}`}>{i.text}</div>)}
            </Card>
          )}
        </div>

        <div className="right-col">
          <div className="price-calc-result">
            <div className="label">{t("panels.pricing.optimal")}</div>
            <div className="big">{formatMoney(optimal, currency)}</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.85 }}>{modelLabel}</div>
          </div>

          {state.competitor > 0 && (
            <Card title={<><span className="icon-lead">⚖️</span> {t("panels.pricing.compare_title")}</>}>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-label">{t("panels.pricing.your_price")}</div><div className="stat-value" style={{ color: "var(--accent)" }}>{formatMoney(optimal, currency)}</div></div>
                <div className="stat-card"><div className="stat-label">{t("panels.pricing.comp_price")}</div><div className="stat-value">{formatMoney(state.competitor, currency)}</div></div>
                <div className="stat-card"><div className="stat-label">{t("panels.pricing.diff")}</div><div className={`stat-value ${diff < 0 ? "positive" : "negative"}`}>{diff > 0 ? "+" : ""}{diff.toFixed(1)}%</div></div>
              </div>
            </Card>
          )}

          <Card title={<><span className="icon-lead">📈</span> {t("panels.pricing.projections_title")}</>}>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-label">{t("panels.pricing.revenue")}</div><div className="stat-value" style={{ fontSize: "1.15rem" }}>{formatMoney(revenue, currency)}</div></div>
              <div className="stat-card"><div className="stat-label">{t("panels.pricing.profit")}</div><div className={`stat-value ${profit >= 0 ? "positive" : "negative"}`} style={{ fontSize: "1.15rem" }}>{formatMoney(profit, currency)}</div></div>
              <div className="stat-card"><div className="stat-label">{t("panels.pricing.annual")}</div><div className="stat-value" style={{ fontSize: "1.15rem" }}>{formatMoney(annual, currency)}</div></div>
              <div className="stat-card"><div className="stat-label">{t("panels.pricing.break_even")}</div><div className="stat-value warning" style={{ fontSize: "1.15rem" }}>{breakEven}</div></div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

// --- ROI Calculator -------------------------------------------------------
function RoiCalculator({ currency }: { currency: Currency }) {
  const { t } = useI18n();
  const load = useServerFn(loadRoiState);
  const save = useServerFn(saveRoiState);
  const [state, setState] = useState<RoiState>({ initial: 0, monthly: 0, savings: 0, revenue: 0, period: 12 });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    load().then((s) => { if (s && Object.keys(s).length) setState((prev) => ({ ...prev, ...s })); setHydrated(true); }).catch(() => setHydrated(true));
  }, [load]);
  useDebouncedEffect(() => { if (hydrated) save({ data: { state } }).catch(() => {}); }, [state, hydrated]);

  const totalCost = state.initial + state.monthly * state.period;
  const totalGain = (state.savings + state.revenue) * state.period;
  const net = totalGain - totalCost;
  const roiPct = totalCost > 0 ? (net / totalCost) * 100 : 0;
  const monthlyNet = state.savings + state.revenue - state.monthly;
  const beMonth = monthlyNet > 0 ? Math.ceil(state.initial / monthlyNet) : 0;
  const beReached = beMonth > 0 && beMonth <= state.period;

  const chartData = useMemo(() => {
    const labels: string[] = [];
    const cost: number[] = [];
    const gain: number[] = [];
    for (let m = 1; m <= state.period; m++) {
      labels.push(`${t("panels.roi.month")} ${m}`);
      cost.push(state.initial + state.monthly * m);
      gain.push((state.savings + state.revenue) * m);
    }
    return {
      labels,
      datasets: [
        { label: t("panels.roi.chart_cost"), data: cost, borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)", fill: true, tension: 0.35 },
        { label: t("panels.roi.chart_gain"), data: gain, borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.15)", fill: true, tension: 0.35 },
      ],
    };
  }, [state, t]);

  const insights: { kind: string; text: string }[] = [];
  if (beReached) insights.push({ kind: "success", text: t("panels.roi.be_month", { n: beMonth }) });
  else if (state.initial > 0) insights.push({ kind: "warn", text: t("panels.roi.be_none") });
  if (monthlyNet !== 0) insights.push({ kind: "info", text: t("panels.roi.net_monthly", { money: formatMoney(monthlyNet, currency) }) });
  if (net !== 0) insights.push({ kind: net > 0 ? "success" : "danger", text: t("panels.roi.net_period", { p: state.period, money: formatMoney(net, currency) }) });

  return (
    <>
      <div className="panel-header">
        <h2><span className="icon-lead">📊</span> {t("panels.roi.h2")}</h2>
        <button className="btn btn-outline btn-sm" onClick={() => setState({ initial: 0, monthly: 0, savings: 0, revenue: 0, period: 12 })}>{t("panels.roi.reset")}</button>
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
          </Card>

          {insights.length > 0 && (
            <Card title={<><span className="icon-lead">💡</span> {t("panels.roi.break_even_title")}</>}>
              {insights.map((i, idx) => <div key={idx} className={`insight-box ${i.kind}`}>{i.text}</div>)}
            </Card>
          )}
        </div>
        <div className="right-col">
          <Card title={<><span className="icon-lead">📊</span> {t("panels.roi.results_title")}</>}>
            <div className="roi-grid">
              <div className="roi-result"><div className="num" style={{ color: "var(--danger)" }}>{formatMoney(totalCost, currency)}</div><div className="lbl">{t("panels.roi.total_cost")}</div></div>
              <div className="roi-result"><div className="num" style={{ color: "var(--success)" }}>{formatMoney(totalGain, currency)}</div><div className="lbl">{t("panels.roi.total_gain")}</div></div>
              <div className="roi-result"><div className="num" style={{ color: net >= 0 ? "var(--success)" : "var(--danger)" }}>{formatMoney(net, currency)}</div><div className="lbl">{t("panels.roi.net")}</div></div>
              <div className="roi-result"><div className="num">{roiPct.toFixed(1)}%</div><div className="lbl">{t("panels.roi.percent")}</div></div>
            </div>
          </Card>
          {state.period > 0 && (
            <Card>
              <div style={{ height: 240 }}>
                <Line data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { labels: { color: "#a1a1aa", font: { size: 11 } } } }, scales: { x: { ticks: { color: "#71717a", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } }, y: { ticks: { color: "#71717a", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } } } }} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

// --- Main dashboard shell -------------------------------------------------
export function DashboardApp() {
  const { t, lang, setLang } = useI18n();
  const [active, setActive] = useState<ModuleKey>("competitor");
  const [currency, setCurrency] = useState<Currency>(() => (typeof window !== "undefined" && (localStorage.getItem("mis_currency") as Currency)) || "USD");
  const [theme, setTheme] = useState<"dark" | "light">(() => (typeof window !== "undefined" && (localStorage.getItem("mis_theme") as "dark" | "light")) || "dark");

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("light-mode", theme === "light");
    localStorage.setItem("mis_theme", theme);
  }, [theme]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("mis_currency", currency); }, [currency]);

  // Keyboard shortcuts: Alt+1..4 to switch modules
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const keys: Record<string, ModuleKey> = { "1": "competitor", "2": "saas", "3": "pricing", "4": "roi" };
      const k = keys[e.key];
      if (k) { e.preventDefault(); setActive(k); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const signOut = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const cards: { key: ModuleKey; icon: string; klass: string; title: string; desc: string; badge: string; shortcut: string }[] = [
    { key: "competitor", icon: "📊", klass: "purple", title: t("cards.competitor.title"), desc: t("cards.competitor.desc"), badge: t("cards.competitor.badge"), shortcut: "Alt+1" },
    { key: "saas", icon: "💼", klass: "orange", title: t("cards.saas.title"), desc: t("cards.saas.desc"), badge: t("cards.saas.badge"), shortcut: "Alt+2" },
    { key: "pricing", icon: "💰", klass: "green", title: t("cards.pricing.title"), desc: t("cards.pricing.desc"), badge: t("cards.pricing.badge"), shortcut: "Alt+3" },
    { key: "roi", icon: "📈", klass: "blue", title: t("cards.roi.title"), desc: t("cards.roi.desc"), badge: t("cards.roi.badge"), shortcut: "Alt+4" },
  ];

  return (
    <>
      <div className="bg-mesh" />
      <nav className="nav">
        <div className="logo">
          <div className="logo-icon">MI</div>
          <span>Market Intelligence</span>
        </div>
        <div className="nav-actions">
          <select className="nav-btn" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} title={t("currency.label")}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
          </select>
          <button className="nav-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "☀️" : "🌙"}<span>{t("nav.theme")}</span></button>
          <button className="nav-btn" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>{t("nav.language")}</button>
          <button className="nav-btn" onClick={signOut}>{t("nav.signout")}</button>
        </div>
      </nav>

      <section className="hero" style={{ paddingBottom: "1.5rem" }}>
        <div className="badge"><span className="badge-dot" />{t("hero.badge")}</div>
        <h1><span>{t("hero.title.a")}</span> {t("hero.title.b")}</h1>
      </section>

      <div className="tools-grid">
        {cards.map((c) => (
          <div key={c.key} className={`tool-card ${active === c.key ? "active" : ""}`} onClick={() => setActive(c.key)}>
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

      <div className="footer">{t("footer.tagline")}</div>
    </>
  );
}
