"use server";

import { revalidatePath } from "next/cache";
import { decryptCard, encryptCard, type CardData } from "@/lib/card-crypto";
import { requireUser } from "@/lib/supabase/server";
import { cardSchema, firstError, walletSchema } from "@/lib/validation";
import type { ActionState } from "./state";

const SAVE_FAILED = { error: "Gagal menyimpan, coba lagi" };
const CARD_TYPES = ["bank", "credit"];

/** Card columns for this save: encrypted new details, cleared, or untouched (undefined). */
function cardColumns(fd: FormData, type: string): { card_enc: string | null; card_last4: string | null } | { error: string } | undefined {
  if (!CARD_TYPES.includes(type) || fd.get("card_clear") === "1") return { card_enc: null, card_last4: null };
  if (!String(fd.get("card_number") ?? "").trim()) return undefined; // left empty = keep what is stored
  const card = cardSchema.safeParse(Object.fromEntries(fd));
  if (!card.success) return { error: firstError(card.error) };
  try {
    return { card_enc: encryptCard(card.data), card_last4: card.data.number.slice(-4) };
  } catch {
    return { error: "Penyimpanan kartu belum dikonfigurasi" };
  }
}

export async function saveWallet(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = walletSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { balance, ...fields } = parsed.data;
  const card = cardColumns(fd, fields.type);
  if (card && "error" in card) return card;
  const { supabase } = await requireUser();
  const id = fd.get("id");

  if (!id) {
    const { error } = await supabase.from("wallets").insert({ ...fields, ...card, initial_balance: balance });
    if (error) return SAVE_FAILED;
  } else {
    const { error } = await supabase.from("wallets").update({ ...fields, ...card }).eq("id", String(id));
    if (error) return SAVE_FAILED;
    // The edited balance is the wallet's current one; the RPC logs old → new and moves initial_balance by the gap.
    if (fd.get("balance") !== null) {
      const res = await supabase.rpc("set_wallet_balance", { p_wallet: String(id), p_balance: balance });
      if (res.error) return SAVE_FAILED;
    }
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setWalletArchived(id: string, archived: boolean): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("wallets")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return SAVE_FAILED;
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Full card details for the owner only (RLS), decrypted on the server for the "show" eye in the card modal. */
export async function revealCard(id: string): Promise<{ card?: CardData; error?: string }> {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("wallets").select("card_enc").eq("id", id).maybeSingle();
  if (!data?.card_enc) return { error: "Kartu tidak ditemukan" };
  try {
    return { card: decryptCard(data.card_enc) };
  } catch {
    return { error: "Kartu tidak bisa dibuka" };
  }
}

export type WalletDetail = {
  adjustments: { previous: number; balance: number; created_at: string }[];
  recent: { id: string; kind: string; amount: number; note: string | null; occurred_at: string; wallet_id: string; category: string | null }[];
};

/** Balance-change history and the latest transactions of one wallet (card modal). */
export async function walletDetail(id: string): Promise<WalletDetail> {
  const { supabase } = await requireUser();
  const [adj, txs] = await Promise.all([
    supabase.from("wallet_balance_adjustments").select("previous,balance,created_at").eq("wallet_id", id).order("created_at", { ascending: false }).limit(10),
    supabase
      .from("transactions")
      .select("id,kind,amount,note,occurred_at,wallet_id,category:categories(name)")
      .or(`wallet_id.eq.${id},to_wallet_id.eq.${id}`)
      .order("occurred_at", { ascending: false })
      .limit(6),
  ]);
  return {
    adjustments: (adj.data ?? []).map((a) => ({ ...a, previous: Number(a.previous), balance: Number(a.balance) })),
    recent: (txs.data ?? []).map(({ category, ...t }) => ({
      ...t,
      amount: Number(t.amount),
      category: (category as unknown as { name: string } | null)?.name ?? null,
    })),
  };
}
