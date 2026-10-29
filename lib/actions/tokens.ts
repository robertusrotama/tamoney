"use server";

import { revalidatePath } from "next/cache";
import { hashToken, newToken } from "@/lib/pintasan";
import { requireUser } from "@/lib/supabase/server";
import type { ActionState } from "./state";

/** Creates a Shortcut token; the plain token is returned once and never stored. */
export async function createToken(_: ActionState, fd: FormData): Promise<ActionState & { token?: string }> {
  const name = String(fd.get("name") ?? "").trim() || "iPhone";
  if (name.length > 50) return { error: "Nama maksimal 50 karakter" };
  const { supabase } = await requireUser();
  const token = newToken();
  const { error } = await supabase.from("api_tokens").insert({ name, token_hash: hashToken(token) });
  if (error) return { error: "Gagal membuat token, coba lagi" };
  revalidatePath("/pintasan");
  return { ok: true, token };
}

export async function revokeToken(id: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("api_tokens").delete().eq("id", id);
  if (error) return { error: "Gagal mencabut token, coba lagi" };
  revalidatePath("/pintasan");
  return { ok: true };
}
