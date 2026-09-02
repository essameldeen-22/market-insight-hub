import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { reviewTransition, type Suggestion } from "./suggestions";

const SuggestionInput = z.object({
  from_tool: z.string().min(2).max(80),
  to_tool: z.string().min(2).max(120),
  save_pct: z.number().min(0.01).max(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  category: z.string().min(2).max(60),
  notes: z.string().max(500).optional().nullable(),
});

/** Anyone signed in can propose an alternative: it lands in the review queue. */
export const submitSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SuggestionInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pending_suggestions").insert({
      ...data,
      from_tool: data.from_tool.trim(),
      to_tool: data.to_tool.trim(),
      user_id: context.userId,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** The signed-in user's own submission history with current status. */
export const listMySuggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pending_suggestions")
      .select("id, from_tool, to_tool, save_pct, difficulty, category, notes, status, review_reason, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Suggestion[];
  });

/** Approved community alternatives, merged into the built-in database client side. */
export const listCommunityAlternatives = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saas_alternatives")
      .select("from_tool, to_tool, save_pct, difficulty, category")
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as { from_tool: string; to_tool: string; save_pct: number; difficulty: string; category: string }[];
  });

async function assertAdmin(supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> }, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || data !== true) throw new Error("FORBIDDEN");
}

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { admin: data === true };
  });

export const listPendingSuggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await assertAdmin(context.supabase as any, context.userId);
    const { data, error } = await context.supabase
      .from("pending_suggestions")
      .select("id, from_tool, to_tool, save_pct, difficulty, category, notes, status, review_reason, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Suggestion[];
  });

export const reviewSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      action: z.enum(["approve", "reject"]),
      reason: z.string().max(300).optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await assertAdmin(context.supabase as any, context.userId);

    const { data: row, error: readErr } = await context.supabase
      .from("pending_suggestions")
      .select("id, from_tool, to_tool, save_pct, difficulty, category, notes, status")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row) throw new Error("NOT_FOUND");

    const outcome = reviewTransition(row as unknown as Suggestion, data.action, context.userId, data.reason);

    if (outcome.alternative) {
      const { error } = await context.supabase.from("saas_alternatives").insert(outcome.alternative);
      if (error) throw new Error(error.message);
    }
    const { error: updErr } = await context.supabase
      .from("pending_suggestions")
      .update(outcome.patch)
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    return { ok: true, status: outcome.patch.status };
  });
