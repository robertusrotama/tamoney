import "server-only";
import type { Supabase } from "./supabase/server";

/** Stamps achieved_at the first time saved ≥ target (used after goal edits and goal transfers). */
export async function markAchieved(sb: Supabase, goalId: string) {
  const [{ data: goal }, { data: txs }] = await Promise.all([
    sb.from("goals").select("target,initial_amount,wallet_id,achieved_at").eq("id", goalId).single(),
    sb.from("transactions").select("amount,wallet_id,to_wallet_id").eq("goal_id", goalId),
  ]);
  if (!goal || goal.achieved_at) return;
  const saved =
    Number(goal.initial_amount) +
    (txs ?? []).reduce((s, t) => s + (t.to_wallet_id === goal.wallet_id ? Number(t.amount) : t.wallet_id === goal.wallet_id ? -Number(t.amount) : 0), 0);
  if (saved >= Number(goal.target)) await sb.from("goals").update({ achieved_at: new Date().toISOString() }).eq("id", goalId);
}
