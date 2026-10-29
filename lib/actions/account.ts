"use server";

import { revalidatePath } from "next/cache";
import { authErrorMessage } from "@/lib/auth";
import { requireUser } from "@/lib/supabase/server";
import { firstError, passwordSchema, profileSchema } from "@/lib/validation";
import type { ActionState } from "./state";

export async function saveProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { error: "Gagal menyimpan, coba lagi" };
  // Keep the auth metadata in step (emails and the sign-up name read it).
  await supabase.auth.updateUser({ data: { display_name: parsed.data.display_name } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Re-checks the current password before changing it, so an open session alone can't take over the account. */
export async function changePassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { supabase, user } = await requireUser();
  const check = await supabase.auth.signInWithPassword({ email: user.email, password: parsed.data.current });
  if (check.error) return { error: "Password saat ini salah" };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: authErrorMessage(error.message) };
  return { ok: true };
}
