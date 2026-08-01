import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/i18n/context";
import { SAAS_CATEGORIES } from "@/lib/saas-alts";
import { listMySuggestions, submitSuggestion } from "@/lib/suggestions.functions";
import type { Suggestion } from "@/lib/suggestions";
import { Card, fmtInt } from "./shared";

export function SuggestionsPanel() {
  const { t } = useI18n();
  const submit = useServerFn(submitSuggestion);
  const listMine = useServerFn(listMySuggestions);

  const [mine, setMine] = useState<Suggestion[]>([]);
  const [fromTool, setFromTool] = useState("");
  const [toTool, setToTool] = useState("");
  const [savePct, setSavePct] = useState(70);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listMine().then((rows) => setMine(rows)).catch(() => {});
  }, [listMine]);

  useEffect(() => { refresh(); }, [refresh]);

  const send = async () => {
    if (!fromTool.trim() || !toTool.trim() || !category) return;
    setBusy(true);
    setMsg(null);
    try {
      await submit({
        data: {
          from_tool: fromTool.trim(),
          to_tool: toTool.trim(),
          save_pct: Math.min(1, Math.max(0.01, savePct / 100)),
          difficulty,
          category,
          notes: notes.trim() || null,
        },
      });
      setFromTool(""); setToTool(""); setNotes("");
      setMsg(t("suggest.sent"));
      refresh();
    } catch {
      setMsg(t("suggest.error"));
    } finally {
      setBusy(false);
    }
  };

  const statusLabel = (s: string) =>
    s === "approved" ? t("suggest.status_approved") : s === "rejected" ? t("suggest.status_rejected") : t("suggest.status_pending");
  const statusColor = (s: string) =>
    s === "approved" ? "var(--success)" : s === "rejected" ? "var(--danger)" : "var(--warning, #f59e0b)";

  return (
    <Card title={<><span className="icon-lead">🌱</span> {t("suggest.title")}</>}>
      <div style={{ fontSize: "0.78rem", color: "var(--text3)", marginBottom: "0.75rem" }}>{t("suggest.hint")}</div>
      <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "1fr 1fr" }}>
        <input value={fromTool} onChange={(e) => setFromTool(e.target.value)} placeholder={t("suggest.from_ph")} />
        <input value={toTool} onChange={(e) => setToTool(e.target.value)} placeholder={t("suggest.to_ph")} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t("panels.saas.pick_cat")}</option>
          {SAAS_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}>
          <option value="easy">{t("suggest.easy")}</option>
          <option value="medium">{t("suggest.medium")}</option>
          <option value="hard">{t("suggest.hard")}</option>
        </select>
        <label style={{ gridColumn: "1 / -1", fontSize: "0.78rem", color: "var(--text2)" }}>
          {t("suggest.save_pct", { pct: fmtInt(savePct) })}
          <input type="range" min={5} max={99} step={5} lang="en" value={savePct} onChange={(e) => setSavePct(Number(e.target.value))} style={{ width: "100%" }} />
        </label>
        <input style={{ gridColumn: "1 / -1" }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("suggest.notes_ph")} />
      </div>
      <button className="btn btn-primary btn-sm" style={{ marginTop: "0.75rem" }} onClick={send} disabled={busy}>
        {busy ? "…" : t("suggest.submit")}
      </button>
      {msg && <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text2)" }}>{msg}</div>}

      <div style={{ marginTop: "1.25rem" }}>
        <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>{t("suggest.my_title")}</div>
        {mine.length === 0 ? (
          <div style={{ color: "var(--text3)", fontSize: "0.8rem" }}>{t("suggest.my_empty")}</div>
        ) : (
          mine.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", padding: "0.45rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.8rem" }}>
              <div>
                <strong>{s.from_tool}</strong> → {s.to_tool}
                {s.review_reason && <div style={{ color: "var(--text3)", fontSize: "0.72rem" }}>{s.review_reason}</div>}
              </div>
              <span style={{ color: statusColor(s.status), whiteSpace: "nowrap" }}>{statusLabel(s.status)}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
