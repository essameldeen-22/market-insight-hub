import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizePlan, type Plan } from "./plan-limits";

/** Current caller's plan. Server-side read so the client cannot fake it. */
export const getMyPlanFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ plan: Plan }> => {
    const { data } = await context.supabase
      .from("profiles")
      .select("plan")
      .eq("id", context.userId)
      .maybeSingle();
    return { plan: normalizePlan(data?.plan) };
  });
