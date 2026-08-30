import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/i18n/context";
import { generateValuePropFn, listValuePropsFn, type StoredValueProp } from "@/lib/value-prop.functions";
import type { ValuePropResult } from "@/lib/value-prop.server";
import { track } from "@/lib/posthog";
import { Card, exportElementToPdf, exportToCsv } from "./shared";
import { SkeletonReport } from "./Animated";

export function ValueProp() {
  const { t, lang } = useI18n();
  const generate = useServerFn(generateValuePropFn);
  const list = useServerFn(listValuePropsFn);
  const [product, setProduct] = useState("");
  const [target, setTarget] = useState("");
  const [pains, setPains] = useState("");
  const [differentiator, setDifferentiator] = useState("");
  const [result, setResult] = useState<ValuePropResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<StoredValueProp[]>([]);

  useEffect(() => {
    list().then((rows) => setHistory(rows)).catch(() => {});
  }, [list]);

  const run = async () => {
    if (!product || !target || !pains || !differentiator) {
      setError(t("panels.vp.missing"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await generate({ data: { product, target, pains, differentiator, lang } });
      setResult(res);
      track("value_prop_generated");
      const refreshed = await list();
      setHistory(refreshed);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("panels.competitor.error"));
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = () => {
    if (lang === "ar") {
      setProduct("لوحة تحكم SaaS للتحليل التنافسي");
      setTarget("مؤسسو منتجات SaaS بين ٥ و ٥٠ موظف");
      setPains("قراءة يدوية لآلاف المراجعات، تسعير مبني على التخمين، تسرب فاتورة SaaS");
      setDifferentiator("ذكاء اصطناعي حقيقي + دعم عربي كامل + متعدد العملات");
    } else {
      setProduct("Competitive intelligence SaaS dashboard");
      setTarget("SaaS product founders at 5-50 person companies");
      setPains("Manual review reading, guesswork pricing, silent SaaS bill bloat");
      setDifferentiator("Real AI + first-class Arabic + multi-currency out of the box");
    }
  };

  const reportRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const doExportPdf = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try { await exportElementToPdf(reportRef.current, "value-proposition.pdf"); }
    finally { setExporting(false); }
  };
  const doExportCsv = () => {
    if (!result) return;
    const rows: (string | number)[][] = [
      ["Style", "Statement"],
      ["Outcome", result.outcome],
      ["Pain", result.pain],
      ["Differentiator", result.differentiator],
      ["Elevator", result.elevator],
    ];
    exportToCsv("value-proposition.csv", rows);
  };

  return (
    <div ref={reportRef}>
      <div className="panel-header">
        <h2><span className="icon-lead">🎯</span> {t("panels.vp.h2")}</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn btn-outline btn-sm" onClick={loadDemo}>{t("panels.competitor.demo")}</button>
          {result && (
            <>
              <button className="btn btn-outline btn-sm" onClick={doExportPdf} disabled={exporting}>📄 {exporting ? "…" : t("actions.export_pdf")}</button>
              <button className="btn btn-outline btn-sm" onClick={doExportCsv}>📊 {t("actions.export_csv")}</button>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="left-col">
          <Card title={<><span className="icon-lead">✏️</span> {t("panels.vp.inputs_title")}</>}>
            <div className="input-group">
              <label>{t("panels.vp.product")}</label>
              <input className="input-field" value={product} onChange={(e) => setProduct(e.target.value)} placeholder={t("panels.vp.product_ph")} />
            </div>
            <div className="input-group">
              <label>{t("panels.vp.target")}</label>
              <input className="input-field" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={t("panels.vp.target_ph")} />
            </div>
            <div className="input-group">
              <label>{t("panels.vp.pains")}</label>
              <textarea className="input-field" rows={3} value={pains} onChange={(e) => setPains(e.target.value)} placeholder={t("panels.vp.pains_ph")} />
            </div>
            <div className="input-group">
              <label>{t("panels.vp.differentiator")}</label>
              <input className="input-field" value={differentiator} onChange={(e) => setDifferentiator(e.target.value)} placeholder={t("panels.vp.diff_ph")} />
            </div>
            <button className="btn btn-primary" onClick={run} disabled={loading}>
              {loading ? t("panels.vp.generating") : t("panels.vp.generate")}
            </button>
            {error && <div className="insight-box danger" style={{ marginTop: "1rem" }}>{error}</div>}
          </Card>

          {history.length > 0 && (
            <Card title={<><span className="icon-lead">🕓</span> {t("panels.vp.history_title")}</>}>
              {history.map((h) => (
                <div key={h.id} className="pain-card" style={{ cursor: "pointer" }} onClick={() => {
                  setProduct(h.product); setTarget(h.target); setPains(h.pains); setDifferentiator(h.differentiator);
                  if (h.result) setResult(h.result);
                }}>
                  <div className="pain-title">{h.product}</div>
                  <div className="pain-desc" style={{ fontSize: "0.75rem" }}>
                    {new Date(h.created_at).toLocaleDateString(lang === "ar" ? "ar-EG-u-nu-latn" : "en-US")}
                    {h.result?.elevator && ` — ${h.result.elevator}`}
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>

        <div className="right-col">
          {loading ? (
            <Card>
              <SkeletonReport lines={4} label={t("panels.vp.generating")} />
            </Card>
          ) : result ? (
            <div className="result-enter">
              <Card title={<><span className="icon-lead">🚀</span> {t("panels.vp.elevator_title")}</>}>
                <div style={{ fontSize: "1.15rem", fontWeight: 600, textAlign: "center", padding: "1rem" }}>{result.elevator}</div>
              </Card>
              <Card title={<><span className="icon-lead">🎯</span> {t("panels.vp.outcome_title")}</>}>
                <div style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{result.outcome}</div>
              </Card>
              <Card title={<><span className="icon-lead">🩹</span> {t("panels.vp.pain_title")}</>}>
                <div style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{result.pain}</div>
              </Card>
              <Card title={<><span className="icon-lead">⭐</span> {t("panels.vp.diff_title")}</>}>
                <div style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{result.differentiator}</div>
              </Card>
            </div>
          ) : (
            <Card>
              <div style={{ padding: "1rem", textAlign: "center", color: "var(--text3)", fontSize: "0.85rem" }}>{t("panels.vp.empty")}</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
