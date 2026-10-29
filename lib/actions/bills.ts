"use server";

import { revalidatePath } from "next/cache";
import { dueDayFor } from "@/lib/bills";
import { walletError } from "@/lib/guards";
import { getActiveWalletIds } from "@/lib/queries";
import { toOccurredAt } from "@/lib/reports";
import { requireUser } from "@/lib/supabase/server";
import { billSchema, firstError, payBillSchema } from "@/lib/validation";
import type { ActionState } from "./state";

const FAILED = { error: "Gagal menyimpan, coba lagi" };
const rpcError = (message: string) =>
  message.includes("sudah dibayar") ? { error: "Tagihan ini sudah dibayar" } : message.includes("tidak ditemukan") ? { error: "Tagihan tidak ditemukan" } : FAILED;

export async function saveBill(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = billSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const b = parsed.data;
  const { supabase } = await requireUser();
  const id = fd.get("id");

  const [prev, category] = await Promise.all([
    id ? supabase.from("bills").select("wallet_id,next_due,due_day").eq("id", String(id)).maybeSingle() : null,
    supabase.from("categories").select("kind").eq("id", b.category_id).maybeSingle(),
  ]);
  if (id && !prev?.data) return { error: "Tagihan tidak ditemukan" };
  if (category.data?.kind !== "expense") return { error: "Pilih kategori pengeluaran" };
  const err = walletError([b.wallet_id], await getActiveWalletIds(supabase), prev?.data ? [prev.data.wallet_id] : []);
  if (err) return { error: err };

  const row = { ...b, due_day: dueDayFor(b.cadence, b.next_due, prev?.data ?? null) };
  const { error } = id ? await supabase.from("bills").update(row).eq("id", String(id)) : await supabase.from("bills").insert(row);
  if (error) return FAILED;
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Records the expense and advances the due date atomically (pay_bill RPC); a stale `due` = already paid. */
export async function payBill(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = payBillSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const p = parsed.data;
  const { supabase } = await requireUser();
  const err = walletError([p.wallet_id], await getActiveWalletIds(supabase));
  if (err) return { error: err };

  const { error } = await supabase.rpc("pay_bill", {
    p_bill: p.bill_id,
    p_due: p.due,
    p_amount: p.amount,
    p_wallet: p.wallet_id,
    p_occurred_at: toOccurredAt(p.occurred_at),
  });
  if (error) return rpcError(error.message);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function skipBill(id: string, due: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("skip_bill", { p_bill: id, p_due: due });
  if (error) return rpcError(error.message);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setBillArchived(id: string, archived: boolean): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("bills")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return FAILED;
  revalidatePath("/", "layout");
  return { ok: true };
}
