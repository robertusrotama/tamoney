"use server";

import { revalidatePath } from "next/cache";
import { walletError } from "@/lib/guards";
import { getActiveWalletIds } from "@/lib/queries";
import { requireUser } from "@/lib/supabase/server";
import { firstError, goalSchema } from "@/lib/validation";
import { markAchieved } from "@/lib/goal-progress";
import type { ActionState } from "./state";

const FAILED = { error: "Gagal menyimpan, coba lagi" };

export async function saveGoal(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = goalSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const g = parsed.data;
  const { supabase } = await requireUser();
  const id = fd.get("id");

  const prev = id ? (await supabase.from("goals").select("wallet_id,source_wallet_id").eq("id", String(id)).maybeSingle()).data : null;
  if (id && !prev) return { error: "Goal tidak ditemukan" };
  const wallets = [g.wallet_id, g.source_wallet_id].filter(Boolean) as string[];
  const err = walletError(wallets, await getActiveWalletIds(supabase), prev ? ([prev.wallet_id, prev.source_wallet_id].filter(Boolean) as string[]) : []);
  if (err) return { error: err };

  // A target raised above what is saved re-opens the goal; markAchieved sets it again when reached.
  const row = { ...g, achieved_at: null };
  const { data, error } = id
    ? await supabase.from("goals").update(row).eq("id", String(id)).select("id").single()
    : await supabase.from("goals").insert(row).select("id").single();
  if (error) return FAILED;
  await markAchieved(supabase, data.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setGoalArchived(id: string, archived: boolean): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("goals")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return FAILED;
  revalidatePath("/", "layout");
  return { ok: true };
}
