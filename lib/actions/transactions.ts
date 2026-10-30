"use server";

import { revalidatePath } from "next/cache";
import { goalTransferError, walletError } from "@/lib/guards";
import { getActiveWalletIds } from "@/lib/queries";
import { toOccurredAt } from "@/lib/reports";
import { requireUser } from "@/lib/supabase/server";
import { firstError, settleSchema, transferSchema, txSchema } from "@/lib/validation";
import { markAchieved } from "@/lib/goal-progress";
import type { ActionState } from "./state";

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

/** The row being edited (RLS: only the user's own), or null for a new one. */
async function existing(sb: Supabase, id: FormDataEntryValue | null) {
  if (!id) return null;
  const { data } = await sb.from("transactions").select("wallet_id,to_wallet_id,occurred_at,kind").eq("id", String(id)).single();
  return data;
}

async function write(sb: Supabase, id: FormDataEntryValue | null, row: Record<string, unknown>): Promise<ActionState> {
  const { error } = id
    ? await sb.from("transactions").update(row).eq("id", String(id))
    : await sb.from("transactions").insert(row);
  if (error) return { error: "Gagal menyimpan, coba lagi" };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveTransaction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = txSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const t = parsed.data;
  const { supabase } = await requireUser();

  const [prev, category] = await Promise.all([
    existing(supabase, fd.get("id")),
    supabase.from("categories").select("kind").eq("id", t.category_id).maybeSingle(),
  ]);
  if (fd.get("id") && (!prev || prev.kind === "transfer")) return { error: "Transaksi tidak ditemukan" };
  if (category.data?.kind !== t.kind) return { error: "Kategori tidak sesuai jenis transaksi" };
  const err = walletError([t.wallet_id], await getActiveWalletIds(supabase), prev ? [prev.wallet_id] : []);
  if (err) return { error: err };

  return write(supabase, fd.get("id"), {
    kind: t.kind,
    amount: t.amount,
    wallet_id: t.wallet_id,
    category_id: t.category_id,
    note: t.note,
    owed_amount: t.owed_amount,
    owed_note: t.owed_note,
    occurred_at: toOccurredAt(t.occurred_at, prev?.occurred_at),
    // "Masukkan ke budget bulanan": the form sends budget_period (period id, or "" when unticked) only where it offers it.
    ...(fd.has("budget_period") && { budget_period_id: t.kind === "income" && fd.get("budget_period") ? String(fd.get("budget_period")) : null }),
  });
}

export async function saveTransfer(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = transferSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const t = parsed.data;
  const { supabase } = await requireUser();

  const prev = await existing(supabase, fd.get("id"));
  if (fd.get("id") && prev?.kind !== "transfer") return { error: "Transaksi tidak ditemukan" };
  const err = walletError([t.wallet_id, t.to_wallet_id], await getActiveWalletIds(supabase), prev ? [prev.wallet_id, prev.to_wallet_id] : []);
  if (err) return { error: err };

  // Setor/Tarik on a goal: the transfer must touch the goal's own wallet.
  const goalId = fd.get("goal_id") ? String(fd.get("goal_id")) : null;
  if (goalId) {
    const { data: goal } = await supabase.from("goals").select("wallet_id,archived_at").eq("id", goalId).maybeSingle();
    if (!goal || goal.archived_at) return { error: "Goal tidak valid" };
    const goalErr = goalTransferError(goal.wallet_id, t.wallet_id, t.to_wallet_id);
    if (goalErr) return { error: goalErr };
  }

  const res = await write(supabase, fd.get("id"), {
    kind: "transfer",
    amount: t.amount,
    wallet_id: t.wallet_id,
    to_wallet_id: t.to_wallet_id,
    note: t.note,
    occurred_at: toOccurredAt(t.occurred_at, prev?.occurred_at),
    ...(goalId && { goal_id: goalId }),
  });
  if (res.ok && goalId) await markAchieved(supabase, goalId);
  return res;
}

export async function deleteTransaction(id: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { data: row } = await supabase.from("transactions").select("reimburses_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus, coba lagi" };
  // Deleting a friend's payback re-opens what they owe (it shows up in notifications again).
  if (row?.reimburses_id) await supabase.from("transactions").update({ owed_settled_at: null }).eq("id", row.reimburses_id);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** "Sudah dibayar": records the friends' payback into a wallet and closes the owed amount (settle_owed RPC). */
export async function settleOwed(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = settleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const s = parsed.data;
  const { supabase } = await requireUser();
  const err = walletError([s.wallet_id], await getActiveWalletIds(supabase));
  if (err) return { error: err };
  const { error } = await supabase.rpc("settle_owed", { p_tx: s.tx_id, p_wallet: s.wallet_id, p_occurred_at: toOccurredAt(s.occurred_at) });
  if (error) return { error: error.message.includes("sudah dibayar") ? "Sudah ditandai dibayar" : "Gagal menyimpan, coba lagi" };
  revalidatePath("/", "layout");
  return { ok: true };
}
