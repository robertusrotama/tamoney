import type { Tx } from "./types";

type Row = Pick<Tx, "kind" | "amount" | "wallet_id" | "to_wallet_id">;

/**
 * A wallet's statement: each row's signed effect on this wallet and the balance right after it.
 * `rows` are newest first; the running balance is walked backwards from the wallet's current balance.
 */
export function walletActivity<T extends Row>(rows: T[], walletId: string, currentBalance: number): (T & { delta: number; balanceAfter: number })[] {
  let balance = currentBalance;
  return rows.map((t) => {
    const delta =
      t.kind === "income" ? t.amount : t.kind === "expense" ? -t.amount : t.to_wallet_id === walletId ? t.amount : -t.amount;
    const row = { ...t, delta, balanceAfter: balance };
    balance -= delta;
    return row;
  });
}
