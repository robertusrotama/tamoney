import type { Goal, TxKind } from "./types";

// Savings goals (spec §6). Progress = tagged transfers, never the wallet's balance.

export type GoalStatus = "tercapai" | "tertinggal" | "sesuai";
export type GoalWithProgress = Goal & { saved: number; need: number; depositedThisPeriod: number; status: GoalStatus };
export type GoalTx = { goal_id: string | null; kind: TxKind; amount: number; wallet_id: string; to_wallet_id: string | null; occurred_at: string };

const days = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000);

/** Net money moved for this goal: into its wallet counts, out of it subtracts. */
export function deposited(goal: Pick<Goal, "id" | "wallet_id">, txs: GoalTx[]): number {
  return txs
    .filter((t) => t.goal_id === goal.id && t.kind === "transfer")
    .reduce((s, t) => s + (t.to_wallet_id === goal.wallet_id ? t.amount : t.wallet_id === goal.wallet_id ? -t.amount : 0), 0);
}

export const saved = (goal: Goal, txs: GoalTx[]) => goal.initial_amount + deposited(goal, txs);

/** Paydays in (today, due], at least 1 — the deposits still to come before the deadline. */
export function paydaysUntil(today: string, due: string, payday: number): number {
  let [y, m] = today.split("-").map(Number);
  let n = 0;
  for (let i = 0; i < 1200; i++) {
    const d = new Date(Date.UTC(y, m - 1, payday)).toISOString().slice(0, 10);
    if (d > due) break;
    if (d > today) n++;
    m++;
    if (m > 12) (m = 1), y++;
  }
  return Math.max(1, n);
}

/** Deposit needed per payday: what is left ÷ paydays until due (rounded up to Rp 1.000), or the fixed amount. */
export function monthlyNeed(goal: Goal, savedNow: number, today: string, payday: number): number {
  const left = goal.target - savedNow;
  if (left <= 0) return 0;
  if (!goal.due_date) return goal.monthly_amount ?? 0;
  return Math.ceil(left / paydaysUntil(today, goal.due_date, payday) / 1000) * 1000;
}

export function goalStatus(a: { target: number; saved: number; need: number; depositedThisPeriod: number; due: string | null; today: string; periodEnd: string }): GoalStatus {
  if (a.saved >= a.target) return "tercapai";
  if (a.due && a.due < a.today) return "tertinggal";
  if (a.depositedThisPeriod < a.need && days(a.today, a.periodEnd) <= 7) return "tertinggal";
  return "sesuai";
}
