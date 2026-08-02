import { useEffect, useRef, useState, type ReactNode } from "react";

// Landing-page-only motion helpers. All of them no-op when the user's OS
// requests reduced motion, and none of them are imported by the dashboard.
function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Fades/slides a section in the first time it enters the viewport. */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  as?: "div" | "section";
  className?: string;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`reveal${shown ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Smooth ease-out count-up for a single numeric stat. Latin digits only. */
export function CountUp({ to, suffix = "", duration = 1400 }: { to: number; suffix?: string; duration?: number }) {
  const [value, setValue] = useState(to);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setValue(to);
      return;
    }
    let raf = 0;
    let start = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      setValue(0);
      const tick = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min(1, (ts - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setValue(Math.round(to * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className="mono-num" lang="en" dir="ltr">
      {value}
      {suffix}
    </span>
  );
}

/**
 * Decorative generative hero backdrop: layered CSS/SVG gradient orbs plus a
 * fine grid, drifting slowly and easing toward the pointer / scroll position.
 * Pure decoration: aria-hidden and pointer-events:none, so it can never
 * intercept clicks or affect text contrast beyond a soft tint.
 */
export function HeroVisual() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      schedule();
    };
    const onScroll = () => {
      el.style.setProperty("--scroll", String(Math.min(1, window.scrollY / 600)));
    };
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        el.style.setProperty("--px", cx.toFixed(3));
        el.style.setProperty("--py", cy.toFixed(3));
        if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) schedule();
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="hero-visual" ref={ref} aria-hidden="true">
      <span className="hv-orb hv-orb-1" />
      <span className="hv-orb hv-orb-2" />
      <span className="hv-orb hv-orb-3" />
      <span className="hv-grid" />
      <svg className="hv-ring" viewBox="0 0 400 400" focusable="false">
        <defs>
          <linearGradient id="hvGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <circle cx="200" cy="200" r="150" fill="none" stroke="url(#hvGrad)" strokeWidth="1" />
        <circle cx="200" cy="200" r="110" fill="none" stroke="url(#hvGrad)" strokeWidth="1" strokeDasharray="4 10" />
        <circle cx="200" cy="200" r="185" fill="none" stroke="url(#hvGrad)" strokeWidth="1" strokeDasharray="1 14" />
      </svg>
    </div>
  );
}
