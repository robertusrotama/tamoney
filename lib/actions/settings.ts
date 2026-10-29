"use server";

import { revalidatePath } from "next/cache";
import { DEFAULT_CATEGORY_MAP, DEFAULT_POS } from "@/lib/budget";
import { requireUser } from "@/lib/supabase/server";
import { budgetSettingsSchema, firstError } from "@/lib/validation";
import type { ActionState } from "./state";

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];
const FAILED = { error: "Gagal menyimpan, coba lagi" };

/** Archive pos instead of deleting them; returns true on error. */
const archive = async (sb: Supabase, ids: string[]) =>
  !!(await sb.from("budget_groups").update({ archived_at: new Date().toISOString() }).in("id", ids)).error;

/** Point every listed category at its pos; every other expense category gets none. */
async function mapCategories(sb: Supabase, byGroup: Record<string, string[]>): Promise<boolean> {
  const listed = Object.values(byGroup).flat();
  const writes = Object.entries(byGroup)
    .filter(([, ids]) => ids.length)
    .map(([gid, ids]) => sb.from("categories").update({ budget_group_id: gid }).in("id", ids));
  let clear = sb.from("categories").update({ budget_group_id: null }).eq("kind", "expense");
  if (listed.length) clear = clear.not("id", "in", `(${listed.join(",")})`);
  const results = await Promise.all([...writes, clear]);
  return results.every((r) => !r.error);
}

/**
 * Pengaturan → Budget. Changes apply to the next salary; existing periods keep their allocations (spec §4.4).
 * The savings pos keeps its flag: an incoming is_savings only matters for its identity check in the schema.
 */
export async function saveBudgetSettings(input: unknown): Promise<ActionState> {
  const parsed = budgetSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { payday, groups } = parsed.data;
  const { supabase, user } = await requireUser();

  const { data: existing, error } = await supabase.from("budget_groups").select("id,is_savings").is("archived_at", null);
  if (error) return FAILED;
  const savingsId = existing.find((g) => g.is_savings)?.id;
  const known = new Set(existing.map((g) => g.id));
  if (groups.some((g) => g.id && !known.has(g.id)) || groups.find((g) => g.is_savings)?.id !== savingsId) return { error: "Pos tidak ditemukan, muat ulang halaman" };

  // Removed pos are archived (past periods keep their allocations), first so a new pos may reuse the name.
  const keep = groups.map((g) => g.id).filter(Boolean) as string[];
  const gone = existing.filter((g) => !g.is_savings && !keep.includes(g.id)).map((g) => g.id);
  if (gone.length && (await archive(supabase, gone))) return FAILED;

  const byGroup: Record<string, string[]> = {};
  for (const [sort, g] of groups.entries()) {
    const row = { name: g.name, icon: g.icon, pct_bp: g.pct_bp, sort };
    const res = g.id
      ? await supabase.from("budget_groups").update(row).eq("id", g.id).select("id").single()
      : await supabase.from("budget_groups").insert({ ...row, is_savings: false }).select("id").single();
    if (res.error) return res.error.code === "23505" ? { error: "Nama pos tidak boleh sama" } : FAILED;
    byGroup[res.data.id] = g.category_ids;
  }

  const [mapped, profile] = await Promise.all([mapCategories(supabase, byGroup), supabase.from("profiles").update({ payday_day: payday }).eq("id", user.id)]);
  if (!mapped || profile.error) return FAILED;
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Back to the §4.3 pos and the default category mapping. Existing periods keep their allocations. */
export async function resetBudgetDefaults(): Promise<ActionState> {
  const { supabase } = await requireUser();
  const [groupsRes, catsRes] = await Promise.all([
    supabase.from("budget_groups").select("id,name,is_savings").is("archived_at", null),
    supabase.from("categories").select("id,name").eq("kind", "expense"),
  ]);
  if (groupsRes.error || catsRes.error) return FAILED;

  const defaults = new Set(DEFAULT_POS.map((p) => p.name));
  const gone = groupsRes.data.filter((g) => !g.is_savings && !defaults.has(g.name)).map((g) => g.id);
  if (gone.length && (await archive(supabase, gone))) return FAILED;

  const idByName: Record<string, string> = {};
  for (const [sort, p] of DEFAULT_POS.entries()) {
    const match = groupsRes.data.find((g) => (p.is_savings ? g.is_savings : g.name === p.name && !g.is_savings));
    const row = { name: p.name, icon: p.icon, pct_bp: p.pct_bp, sort };
    const res = match
      ? await supabase.from("budget_groups").update(row).eq("id", match.id).select("id").single()
      : await supabase.from("budget_groups").insert({ ...row, is_savings: false }).select("id").single();
    if (res.error) return FAILED;
    idByName[p.name] = res.data.id;
  }

  const byGroup: Record<string, string[]> = {};
  for (const c of catsRes.data) {
    const gid = idByName[DEFAULT_CATEGORY_MAP[c.name] ?? ""];
    if (gid) (byGroup[gid] ??= []).push(c.id);
  }
  if (!(await mapCategories(supabase, byGroup))) return FAILED;
  revalidatePath("/", "layout");
  return { ok: true };
}
