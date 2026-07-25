import { useEffect } from "react";
import type { ReactNode } from "react";

export function Card({
  title,
  children,
  right,
}: {
  title?: ReactNode;
  children: ReactNode;
  right?: ReactNode;
}) {
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

export function useDebouncedEffect(effect: () => void, deps: unknown[], delay = 600) {
  useEffect(() => {
    const id = setTimeout(effect, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}

// PDF export — lazy-loads jsPDF + html2canvas to keep initial bundle small.
export async function exportElementToPdf(el: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(el, { backgroundColor: "#0a0a0f", scale: 2, useCORS: true });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
  pdf.addImage(img, "PNG", (pageW - canvas.width * ratio) / 2, 20, canvas.width * ratio, canvas.height * ratio);
  pdf.save(filename);
}

// CSV export — safe against quotes, commas, newlines; Western digits guaranteed
// because inputs are already numeric or plain strings.
export function exportToCsv(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const body = rows.map((r) => r.map(escape).join(",")).join("\n");
  // BOM so Excel opens Arabic correctly.
  const blob = new Blob(["\ufeff" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Formatter helpers that always force Western digits.
export function fmtInt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    numberingSystem: "latn",
    maximumFractionDigits: 0,
  }).format(n);
}
export function fmtPct(n: number, digits = 1): string {
  return new Intl.NumberFormat("en-US", {
    numberingSystem: "latn",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}
