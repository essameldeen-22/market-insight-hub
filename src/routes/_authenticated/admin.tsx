import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/i18n/context";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { amIAdmin, listPendingSuggestions, reviewSuggestion } from "@/lib/suggestions.functions";
import type { Suggestion } from "@/lib/suggestions";
import { Card, fmtInt } from "@/components/dashboard/shared";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Suggestion review — Market Intelligence Suite" },
      { name: "description", content: "Admin review queue for community-submitted SaaS alternatives." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { t } = useI18n();
  const checkAdmin = useServerFn(amIAdmin);
  const listPending = useServerFn(listPendingSuggestions);
  const review = useServerFn(reviewSuggestion);

  const [admin, setAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const refresh = useCallback(() => {
    listPending().then(setRows).catch(() => setRows([]));
  }, [listPending]);

  useEffect(() => {
    checkAdmin()
      .then((r) => {
        setAdmin(r.admin);
        if (r.admin) refresh();
      })
      .catch(() => setAdmin(false));
  }, [checkAdmin, refresh]);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    try {
      await review({ data: { id, action, reason: reasons[id] || null } });
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch {
      /* leave row in place */
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="bg-mesh" />
      <SiteNav />
      <section className="hero" style={{ paddingBottom: "1rem" }}>
        <h1><span>{t("admin.title")}</span></h1>
        <p>{t("admin.subtitle")}</p>
      </section>
      <div style={{ maxWidth: 860, margin: "0 auto 5rem", padding: "0 1.5rem" }}>
        {admin === null && <Card><div style={{ color: "var(--text3)" }}>…</div></Card>}
        {admin === false && <Card><div style={{ color: "var(--danger)" }}>{t("admin.forbidden")}</div></Card>}
        {admin && (
          <Card title={t("admin.queue")}>
            {rows.length === 0 ? (
              <div style={{ color: "var(--text3)", fontSize: "0.85rem" }}>{t("admin.empty")}</div>
            ) : (
              rows.map((s) => (
                <div key={s.id} style={{ borderBottom: "1px solid var(--border)", padding: "0.85rem 0" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{s.from_tool} → {s.to_tool}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text3)", margin: "0.25rem 0 0.5rem" }}>
                    {s.category} · {s.difficulty} · {fmtInt(Math.round(s.save_pct * 100))}% {t("admin.savings")}
                    {s.notes ? ` · ${s.notes}` : ""}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <input
                      style={{ flex: "1 1 220px" }}
                      placeholder={t("admin.reason_ph")}
                      value={reasons[s.id] ?? ""}
                      onChange={(e) => setReasons((p) => ({ ...p, [s.id]: e.target.value }))}
                    />
                    <button className="btn btn-primary btn-sm" disabled={busy === s.id} onClick={() => act(s.id, "approve")}>✓ {t("admin.approve")}</button>
                    <button className="btn btn-outline btn-sm" disabled={busy === s.id} onClick={() => act(s.id, "reject")}>✕ {t("admin.reject")}</button>
                  </div>
                </div>
              ))
            )}
          </Card>
        )}
      </div>
      <SiteFooter />
    </>
  );
}
