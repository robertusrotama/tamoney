"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { firstError, walletSchema } from "@/lib/validation";
import type { ActionState } from "./state";

const SAVE_FAILED = { error: "Gagal menyimpan, coba lagi" };

export async function saveWallet(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = walletSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { supabase } = await requireUser();
  const id = fd.get("id");
  const { error } = id
    ? await supabase.from("wallets").update(parsed.data).eq("id", String(id))
    : await supabase.from("wallets").insert(parsed.data);
  if (error) return SAVE_FAILED;
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
