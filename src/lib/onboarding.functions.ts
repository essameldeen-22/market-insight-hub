import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Whether the signed-in user has already seen the 3-step onboarding tour. */
export const getOnboardingState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("has_seen_onboarding")
      .eq("id", context.userId)
      .maybeSingle();
    return { seen: (data as { has_seen_onboarding?: boolean } | null)?.has_seen_onboarding === true };
  });

export const setOnboardingSeen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ seen: z.boolean().default(true) }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ has_seen_onboarding: data.seen } as any)
      .eq("id", context.userId);
    return { ok: true };
  });
