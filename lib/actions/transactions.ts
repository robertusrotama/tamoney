"use server";

import { revalidatePath } from "next/cache";
import { walletError } from "@/lib/guards";
import { getActiveWalletIds } from "@/lib/queries";
import { toOccurredAt } from "@/lib/reports";
import { requireUser } from "@/lib/supabase/server";
import { firstError, transferSchema } from "@/lib/validation";
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

export async function saveTransfer(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = transferSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const t = parsed.data;
  const { supabase } = await requireUser();

  const prev = await existing(supabase, fd.get("id"));
  if (fd.get("id") && prev?.kind !== "transfer") return { error: "Transaksi tidak ditemukan" };
  const err = walletError([t.wallet_id, t.to_wallet_id], await getActiveWalletIds(supabase), prev ? [prev.wallet_id, prev.to_wallet_id] : []);
  if (err) return { error: err };

  return write(supabase, fd.get("id"), {
    kind: "transfer",
    amount: t.amount,
    wallet_id: t.wallet_id,
    to_wallet_id: t.to_wallet_id,
    note: t.note,
    occurred_at: toOccurredAt(t.occurred_at, prev?.occurred_at),
  });
}

export async function deleteTransaction(id: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus, coba lagi" };
  revalidatePath("/", "layout");
  return { ok: true };
}
