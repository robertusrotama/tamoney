"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authErrorMessage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "./state";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const origin = async () => (await headers()).get("origin") ?? "";
const MIN_PASSWORD = 8;

export async function signIn(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: str(fd, "email"), password: str(fd, "password") });
  if (error) return { error: authErrorMessage(error.message) };
  redirect("/");
}

export async function signUp(_: ActionState, fd: FormData): Promise<ActionState> {
  const password = str(fd, "password");
  if (password.length < MIN_PASSWORD) return { error: `Password minimal ${MIN_PASSWORD} karakter` };
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: str(fd, "email"),
    password,
    options: {
      data: { display_name: str(fd, "name") },
      emailRedirectTo: `${await origin()}/auth/callback`,
    },
  });
  if (error) return { error: authErrorMessage(error.message) };
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/masuk");
}

export async function requestPasswordReset(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(str(fd, "email"), {
    redirectTo: `${await origin()}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: authErrorMessage(error.message) };
  return { ok: true };
}

export async function updatePassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const password = str(fd, "password");
  if (password.length < MIN_PASSWORD) return { error: `Password minimal ${MIN_PASSWORD} karakter` };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authErrorMessage(error.message) };
  redirect("/");
}
