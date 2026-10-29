import "server-only";
import { cache } from "react";
import { fetchAllPages } from "./paging";
import type { Supabase } from "./supabase/server";
import type { Category, Tx, Wallet } from "./types";

export type TxWithCategory = Tx & { category_name: string | null; category_icon: string | null };

function must<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

// cache(): layout and page ask for the same data in one request; arguments must be primitives/same refs.
export const getWallets = cache(async (sb: Supabase, includeArchived = false): Promise<Wallet[]> => {
  let q = sb.from("wallets").select("id,name,type,initial_balance,archived_at,color,pattern").order("created_at");
  if (!includeArchived) q = q.is("archived_at", null);
  const [wallets, balances] = await Promise.all([q, sb.from("wallet_balances").select("wallet_id,balance")]);
  const byId = new Map(must(balances).map((b) => [b.wallet_id as string, Number(b.balance)]));
  return must(wallets).map((w) => ({ ...w, initial_balance: Number(w.initial_balance), balance: byId.get(w.id) ?? 0 }));
});

export async function getActiveWalletIds(sb: Supabase): Promise<string[]> {
  return must(await sb.from("wallets").select("id").is("archived_at", null)).map((w) => w.id as string);
}

export const getCategories = cache(async (sb: Supabase): Promise<Category[]> =>
  must(await sb.from("categories").select("id,kind,name,icon").order("created_at")),
);

const TX_COLUMNS = "id,kind,amount,wallet_id,to_wallet_id,category_id,note,occurred_at,category:categories(name,icon)";

type TxRow = Tx & { category: { name: string; icon: string } | null };
const flatten = (rows: TxRow[]): TxWithCategory[] =>
  rows.map(({ category, ...t }) => ({
    ...t,
    amount: Number(t.amount),
    category_name: category?.name ?? null,
    category_icon: category?.icon ?? null,
  }));

/** Transactions with occurred_at in [startIso, endIso), newest first. */
export async function getTransactionsBetween(sb: Supabase, startIso: string, endIso: string): Promise<TxWithCategory[]> {
  const rows = await fetchAllPages(async (from, to) =>
    must(
      await sb
        .from("transactions")
        .select(TX_COLUMNS)
        .gte("occurred_at", startIso)
        .lt("occurred_at", endIso)
        .order("occurred_at", { ascending: false })
        .order("id") // stable order so pages don't overlap
        .range(from, to),
    ),
  );
  return flatten(rows as unknown as TxRow[]);
}

export async function getRecentTransfers(sb: Supabase, limit = 10): Promise<TxWithCategory[]> {
  const rows = must(
    await sb
      .from("transactions")
      .select(TX_COLUMNS)
      .eq("kind", "transfer")
      .order("occurred_at", { ascending: false })
      .limit(limit),
  );
  return flatten(rows as unknown as TxRow[]);
}

