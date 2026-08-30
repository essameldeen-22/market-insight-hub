import { useEffect, useRef, useState } from "react";

// Dashboard-only motion helpers. Same IntersectionObserver + eased rAF pattern
// as the landing page's motion.tsx, but able to format the animated value
// (money, percentages) instead of rendering a raw integer.

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Counts up to `value` with an ease-out curve whenever the value changes,
 * rendering each frame through `format`. No-ops under reduced motion.
 */
export function AnimatedValue({
  value,
  format = (n: number) => String(Math.round(n)),
  duration = 900,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = value;
    if (prefersReducedMotion() || from === value) {
      setShown(value);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span lang="en" dir="ltr" className="mono-num">
      {format(shown)}
    </span>
  );
}

/** Single shimmering placeholder line/block. */
export function Skeleton({ height = 14, width = "100%", radius = 6 }: { height?: number | string; width?: number | string; radius?: number }) {
  return <div className="dash-skeleton" style={{ height, width, borderRadius: radius }} aria-hidden="true" />;
}

/** Placeholder that mirrors the shape of an analysis / generation result. */
export function SkeletonReport({ lines = 4, label }: { lines?: number; label?: string }) {
  return (
    <div className="dash-skeleton-wrap" role="status" aria-live="polite" aria-busy="true">
      {label && <div className="dash-skeleton-label">{label}</div>}
      <Skeleton height={22} width="60%" />
      <div className="dash-skeleton-row">
        <Skeleton height={54} />
        <Skeleton height={54} />
        <Skeleton height={54} />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i % 3 === 2 ? "70%" : "100%"} />
      ))}
    </div>
  );
}
