import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/i18n/context";
import { analyzeReviewsFn } from "@/lib/claude.functions";
import type { AnalysisResult } from "@/lib/claude.server";
import { track } from "@/lib/posthog";
import { CountUp } from "@/components/landing/motion";
import { Card, exportElementToPdf, exportToCsv, fmtInt, fmtPct } from "./shared";
import { SkeletonReport } from "./Animated";

interface Competitor {
  id: string;
  name: string;
  reviews: string;
  result?: AnalysisResult;
  previous?: { result: AnalysisResult; created_at: string } | null;
  cached?: boolean;
  loading?: boolean;
  error?: string;
}

const COMPETITOR_DEMOS: Record<"ar" | "en", { name: string; reviews: string[] }[]> = {
  ar: [
    {
      name: "سماعات بلوتوث XYZ",
      reviews: [
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
      ],
    },
    {
      name: "ساعة ذكية ABC",
      reviews: [
        "الشاشة واضحة تحت الشمس بشكل ممتاز",
        "التطبيق بطيء ومليان bugs، محتاج تحديث",
        "دقة قياس النبض ممتازة أثناء الجري",
        "بتفصل عن الموبايل كل شوية",
        "التصميم أنيق ومناسب للاستخدام اليومي",
        "البطارية بتكفي 5 أيام فعلاً",
        "السعر أعلى من المنافسين بدون مبرر",
        "خاصية GPS دقيقة جداً",
      ],
    },
    {
      name: "لابتوب DEF Pro",
      reviews: [
        "الأداء ممتاز في تشغيل البرامج الثقيلة",
        "بيسخن جداً بعد ساعة استخدام",
        "لوحة المفاتيح مريحة والإضاءة رائعة",
        "المروحة صوتها عالي في الألعاب",
        "الشاشة ألوانها دقيقة ومناسبة للتصميم",
        "الوزن ثقيل جداً للحمل اليومي",
      ],
    },
  ],
  en: [
    {
      name: "XYZ Bluetooth Headphones",
      reviews: [
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
      ],
    },
    {
      name: "ABC Smart Watch",
      reviews: [
        "Screen is perfectly readable in sunlight",
        "Companion app is slow and full of bugs",
        "Heart-rate tracking is very accurate while running",
        "Disconnects from my phone constantly",
        "Sleek design, works well for daily wear",
        "Battery genuinely lasts 5 days",
        "Priced higher than competitors without clear reason",
        "GPS is spot on",
      ],
    },
    {
      name: "DEF Pro Laptop",
      reviews: [
        "Handles heavy workloads without a stutter",
        "Runs very hot after about an hour of use",
        "Keyboard is comfortable and backlighting is great",
        "Fan noise is loud under gaming load",
        "Colors on the display are accurate, great for design",
        "Too heavy to carry around every day",
      ],
    },
  ],
};

export function CompetitorAnalysis() {
  const { t, lang } = useI18n();
  const analyze = useServerFn(analyzeReviewsFn);
  const [products, setProducts] = useState<Competitor[]>([
    { id: crypto.randomUUID(), name: "", reviews: "" },
  ]);
  const reportRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [exporting, setExporting] = useState<string | null>(null);

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
      const res = await analyze({ data: { productName: target.name, reviews } });
      track("competitor_analysis_run", { cached: res.cached });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, result: res.result, previous: res.previous, cached: res.cached, loading: false } : p,
        ),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("panels.competitor.error");
      const friendly = msg === "RATE_LIMIT_DAILY" ? t("panels.competitor.rate_limit") : msg;
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, loading: false, error: friendly } : p)));
    }
  };

  const loadDemo = (id: string, idx: number) => {
    const dataset = COMPETITOR_DEMOS[lang];
    const pick = dataset[idx % dataset.length];
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, name: pick.name, reviews: pick.reviews.join("\n") } : p)));
  };

  const exportPdf = async (id: string, name: string) => {
    const el = reportRefs.current[id];
    if (!el) return;
    try {
      setExporting(id);
      const safe = (name || "competitor-analysis").replace(/[^\w\u0621-\u064A -]/g, "_").slice(0, 60);
      await exportElementToPdf(el, `${safe}.pdf`);
    } finally {
      setExporting(null);
    }
  };

  const exportCsv = (p: Competitor) => {
    if (!p.result) return;
    const r = p.result;
    const rows: (string | number)[][] = [];
    rows.push(["Section", "Key", "Value"]);
    rows.push(["Meta", "Product", p.name]);
    rows.push(["Meta", "Total reviews", r.totalReviews]);
    rows.push(["Sentiment", "Positive", r.sentiment.positive]);
    rows.push(["Sentiment", "Negative", r.sentiment.negative]);
    rows.push(["Sentiment", "Mixed", r.sentiment.mixed]);
    rows.push(["Sentiment", "Neutral", r.sentiment.neutral]);
    for (const topic of r.topics)
      rows.push(["Topic", topic.topic, `${topic.count} (${topic.lean})`]);
    for (const pain of r.pains) rows.push(["Pain", pain.title, pain.description]);
    for (const s of r.strengths) rows.push(["Strength", s.title, s.description]);
    const safe = (p.name || "competitor-analysis").replace(/[^\w -]/g, "_").slice(0, 60);
    exportToCsv(`${safe}.csv`, rows);
  };

  return (
    <div>
      <div className="panel-header">
        <h2>
          <span className="icon-lead">📊</span> {t("panels.competitor.h2")}
        </h2>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setProducts((p) => [...p, { id: crypto.randomUUID(), name: "", reviews: "" }])}
        >
          + {t("panels.competitor.add_product")}
        </button>
      </div>

      {products.map((p, idx) => (
        <div
          key={p.id}
          className="dashboard-grid"
          style={{ marginBottom: "2rem" }}
          ref={(el) => {
            reportRefs.current[p.id] = el;
          }}
        >
          <div className="left-col">
            <Card
              title={
                <>
                  <span className="icon-lead">✏️</span> {t("panels.competitor.input_title")}: {t("panels.competitor.product_n")} {idx + 1}
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
                <input
                  className="input-field"
                  value={p.name}
                  onChange={(e) => setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))}
                  placeholder={t("panels.competitor.product_placeholder")}
                />
              </div>
              <div className="input-group">
                <label>{t("panels.competitor.reviews_label")}</label>
                <textarea
                  className="input-field"
                  rows={8}
                  value={p.reviews}
                  onChange={(e) => setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, reviews: e.target.value } : x)))}
                  placeholder={t("panels.competitor.reviews_placeholder")}
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={() => runAnalyze(p.id)} disabled={p.loading}>
                  {p.loading ? t("panels.competitor.analyzing") : t("panels.competitor.analyze")}
                </button>
                <button className="btn btn-outline" onClick={() => loadDemo(p.id, idx)} disabled={p.loading}>
                  {t("panels.competitor.demo")}
                </button>
                {p.result && (
                  <>
                    <button className="btn btn-outline" onClick={() => exportPdf(p.id, p.name)} disabled={exporting === p.id}>
                      📄 {exporting === p.id ? "…" : t("panels.competitor.export_pdf")}
                    </button>
                    <button className="btn btn-outline" onClick={() => exportCsv(p)}>
                      📊 {t("actions.export_csv")}
                    </button>
                  </>
                )}
              </div>
              {p.error && <div className="insight-box danger" style={{ marginTop: "1rem" }}>{p.error}</div>}
              {p.cached && <div className="insight-box info" style={{ marginTop: "1rem", fontSize: "0.8rem" }}>💾 {t("panels.competitor.cached_note")}</div>}
              {p.loading && (
                <div className="loading active">
                  <div className="spinner" />
                  <div style={{ color: "var(--text2)", fontSize: "0.9rem" }}>{t("panels.competitor.analyzing")}</div>
                </div>
              )}
            </Card>

            {p.loading && (
              <Card>
                <SkeletonReport lines={5} label={t("panels.competitor.analyzing")} />
              </Card>
            )}

            {!p.loading && p.result && (
              <div className="result-enter" key={`res-${p.id}-${p.result.totalReviews}`}>
                {p.previous && <ComparisonCard previous={p.previous.result} current={p.result} prevDate={p.previous.created_at} />}
                <Card title={<><span className="icon-lead">🔥</span> {t("panels.competitor.topics_title")}</>}>
                  <TopicsList topics={p.result.topics} />
                </Card>
                <Card title={<><span className="icon-lead">⚠️</span> {t("panels.competitor.pains_title")}</>}>
                  {p.result.pains.length === 0 && <div className="pain-desc">-</div>}
                  {p.result.pains.map((pain, i) => (
                    <div key={i} className="pain-card">
                      <div className="pain-title">🔴 {pain.title}</div>
                      <div className="pain-desc">{pain.description}</div>
                    </div>
                  ))}
                </Card>
                <Card title={<><span className="icon-lead">✅</span> {t("panels.competitor.strengths_title")}</>}>
                  {p.result.strengths.length === 0 && <div className="pain-desc">-</div>}
                  {p.result.strengths.map((s, i) => (
                    <div key={i} className="pain-card positive">
                      <div className="pain-title">🟢 {s.title}</div>
                      <div className="pain-desc">{s.description}</div>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>
          <div className="right-col">
            {p.loading ? (
              <Card>
                <SkeletonReport lines={3} />
              </Card>
            ) : p.result ? (
              <div className="result-enter">
                <Card title={<><span className="icon-lead">📈</span> {t("panels.competitor.stats_title")}</>}>
                  <SentimentStats result={p.result} />
                </Card>
                <Card title={<><span className="icon-lead">💡</span> {t("panels.competitor.insights_title")}</>}>
                  <InsightsList result={p.result} />
                </Card>
              </div>
            ) : (
              <Card>
                <div style={{ padding: "1rem", textAlign: "center", color: "var(--text3)", fontSize: "0.85rem" }}>
                  {t("panels.competitor.empty")}
                </div>
              </Card>
            )}
          </div>

        </div>
      ))}
    </div>
  );
}

function ComparisonCard({
  previous,
  current,
  prevDate,
}: {
  previous: AnalysisResult;
  current: AnalysisResult;
  prevDate: string;
}) {
  const { t, lang } = useI18n();
  const pctOf = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);
  const rows: { label: string; prev: number; cur: number }[] = [
    { label: t("panels.competitor.stat_pos"), prev: pctOf(previous.sentiment.positive, previous.totalReviews), cur: pctOf(current.sentiment.positive, current.totalReviews) },
    { label: t("panels.competitor.stat_neg"), prev: pctOf(previous.sentiment.negative, previous.totalReviews), cur: pctOf(current.sentiment.negative, current.totalReviews) },
    { label: t("panels.competitor.stat_mix"), prev: pctOf(previous.sentiment.mixed, previous.totalReviews), cur: pctOf(current.sentiment.mixed, current.totalReviews) },
  ];
  const dateStr = prevDate
    ? new Date(prevDate).toLocaleDateString(lang === "ar" ? "ar-EG-u-nu-latn" : "en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  const prevTopTopics = new Set(previous.topics.slice(0, 5).map((x) => x.topic));
  const curTopTopics = current.topics.slice(0, 5).map((x) => x.topic);
  const newTopics = curTopTopics.filter((x) => !prevTopTopics.has(x));
  return (
    <Card title={<><span className="icon-lead">📉</span> {t("panels.competitor.vs_previous_title", { date: dateStr })}</>}>
      <div className="stats-grid">
        {rows.map((r) => {
          const delta = r.cur - r.prev;
          const isUp = delta > 0.5;
          const isDown = delta < -0.5;
          const color = r.label === t("panels.competitor.stat_neg")
            ? isUp ? "var(--danger)" : isDown ? "var(--success)" : "var(--text2)"
            : isUp ? "var(--success)" : isDown ? "var(--danger)" : "var(--text2)";
          const arrow = isUp ? "↑" : isDown ? "↓" : "→";
          return (
            <div key={r.label} className="stat-card">
              <div className="stat-label">{r.label}</div>
              <div className="stat-value" style={{ color, fontSize: "1.1rem" }}>
                {arrow} {fmtPct(Math.abs(delta), 1)}%
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text3)" }}>
                {fmtPct(r.prev, 0)}% → {fmtPct(r.cur, 0)}%
              </div>
            </div>
          );
        })}
      </div>
      {newTopics.length > 0 && (
        <div className="insight-box info" style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
          🆕 {t("panels.competitor.new_topics")}: {newTopics.join(", ")}
        </div>
      )}
    </Card>
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
            <div className="stat-value" style={{ color }}><CountUp to={val} duration={900} /></div>
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
            <div className="topic-name">
              {topic.topic}{" "}
              <span style={{ fontSize: "0.7rem", color: "var(--text3)", marginInlineStart: "0.5rem" }}>{leanText[topic.lean]}</span>
            </div>
            <div className="topic-bar-bg">
              <div className="topic-bar-fill" style={{ width: `${(topic.count / max) * 100}%` }} />
            </div>
          </div>
          <div className="topic-count">{fmtInt(topic.count)} {t("panels.competitor.mentions")}</div>
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
