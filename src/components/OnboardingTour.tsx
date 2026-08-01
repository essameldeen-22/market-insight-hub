import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/i18n/context";
import { getOnboardingState, setOnboardingSeen } from "@/lib/onboarding.functions";

// Lightweight 3-step tour. No new dependency: a fixed spotlight card that
// points at existing UI regions by anchor id, shown once per account.
const STEPS = [
  { anchor: "tour-tools", key: "tour.step1" },
  { anchor: "tour-data", key: "tour.step2" },
  { anchor: "tour-controls", key: "tour.step3" },
] as const;

export function OnboardingTour() {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const load = useServerFn(getOnboardingState);
  const markSeen = useServerFn(setOnboardingSeen);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((r) => { if (!cancelled && !r.seen) setOpen(true); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const el = document.getElementById(STEPS[step].anchor);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("tour-highlight");
    return () => el.classList.remove("tour-highlight");
  }, [open, step]);

  const dismiss = () => {
    setOpen(false);
    markSeen({ data: { seen: true } }).catch(() => {});
  };

  if (!open) return null;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label={t("tour.title")}>
      <div className="tour-card">
        <div className="tour-step-count">{step + 1} / {STEPS.length}</div>
        <h3>{t("tour.title")}</h3>
        <p>{t(STEPS[step].key)}</p>
        <div className="tour-actions">
          <button className="btn btn-outline btn-sm" onClick={dismiss}>{t("tour.skip")}</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
          >
            {isLast ? t("tour.done") : t("tour.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
