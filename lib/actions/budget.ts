"use server";

import { revalidatePath } from "next/cache";
import { walletError } from "@/lib/guards";
import { getActiveWalletIds } from "@/lib/queries";
import { toOccurredAt } from "@/lib/reports";
import { requireUser } from "@/lib/supabase/server";
import { firstError, salarySchema } from "@/lib/validation";
import type { ActionState } from "./state";

/** Form fields alloc_<groupId> → { groupId: "1.200.000" }. */
const allocations = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].filter(([k]) => k.startsWith("alloc_")).map(([k, v]) => [k.slice(6), String(v)]));

export async function recordSalary(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = salarySchema.safeParse({ ...Object.fromEntries(fd), alloc: allocations(fd) });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const s = parsed.data;
  const { supabase } = await requireUser();

  // The salary's current wallet may stay even if archived since (editing an old month).
  const { data: prev } = await supabase.from("budget_periods").select("transactions!budget_periods_income_tx_id_user_id_fkey(wallet_id)").eq("month", `${s.month}-01`).maybeSingle();
  const keep = (prev?.transactions as unknown as { wallet_id: string } | null)?.wallet_id;
  const err = walletError([s.wallet_id], await getActiveWalletIds(supabase), keep ? [keep] : []);
  if (err) return { error: err };

  const { error } = await supabase.rpc("record_salary", {
    p_month: `${s.month}-01`,
    p_salary: s.amount,
    p_wallet: s.wallet_id,
    p_occurred_at: toOccurredAt(s.occurred_at),
    p_allocations: s.alloc,
  });
  if (error) return { error: error.message.includes("alokasi") ? "Total alokasi harus sama dengan gaji" : "Gagal menyimpan, coba lagi" };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Removes one month's salary: its budget period (allocations cascade) and the salary income transaction. */
export async function deleteSalary(periodId: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { data: period } = await supabase.from("budget_periods").select("income_tx_id").eq("id", periodId).maybeSingle();
  if (!period) return { error: "Periode tidak ditemukan" };
  const { error } = await supabase.from("budget_periods").delete().eq("id", periodId);
  if (error) return { error: "Gagal menghapus, coba lagi" };
  if (period.income_tx_id) await supabase.from("transactions").delete().eq("id", period.income_tx_id);
  revalidatePath("/", "layout");
  return { ok: true };
}
