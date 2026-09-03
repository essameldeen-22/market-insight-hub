// Client-side plan lookup for feature gating in the dashboard.
// The server enforces limits; this hook only decides what the UI offers.
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyPlanFn } from "./plan.functions";
import type { Plan } from "./plan-limits";

export function isPaidPlan(plan: Plan): boolean {
  return plan === "pro" || plan === "team";
}

export function usePlan(): { plan: Plan; paid: boolean; loading: boolean } {
  const fetchPlan = useServerFn(getMyPlanFn);
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPlan()
      .then((res) => {
        if (!cancelled) setPlan(res.plan);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPlan]);

  return { plan, paid: isPaidPlan(plan), loading };
}
