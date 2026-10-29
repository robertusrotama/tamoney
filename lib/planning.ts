import "server-only";
import { cache } from "react";
import { periodRange, usage } from "./budget";
import type { GoalWithProgress } from "./goals";
import { isoRange } from "./period";
import { getCategories, getTransactionsBetween } from "./queries";
import { todayWib } from "./reports";
import type { Supabase } from "./supabase/server";
import type { Bill, BudgetGroup, BudgetPeriod } from "./types";

export type PeriodView = {
  index: number;
  period: BudgetPeriod;
  range: { start: string; end: string | null };
  usage: ReturnType<typeof usage>;
};

export type PlanningState = {
  today: string;
  payday: number;
  groups: BudgetGroup[];
  periods: BudgetPeriod[]; // oldest first
  /** Wallet of the latest salary, to preselect next time. */
  salaryWallet: string | null;
  current: PeriodView | null;
  bills: Bill[];
  goals: GoalWithProgress[];
};

function must<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

type PeriodRow = Omit<BudgetPeriod, "allocations" | "salary"> & {
  salary: number | string;
  budget_allocations: { group_id: string; amount: number | string }[];
  transactions: { wallet_id: string } | null;
};

/** Usage of one period: its transactions from start to its end (or today while it is still running). */
export async function loadPeriodView(sb: Supabase, s: Pick<PlanningState, "groups" | "periods" | "today" | "goals">, index: number): Promise<PeriodView> {
  const period = s.periods[index];
  const range = periodRange(s.periods, index);
  const { start, end } = isoRange(range.start, range.end ?? s.today);
  const [rows, categories] = await Promise.all([getTransactionsBetween(sb, start, end), getCategories(sb)]);
  const catGroup = Object.fromEntries(categories.map((c) => [c.id, c.budget_group_id]));
  const goalWallets = Object.fromEntries(s.goals.map((g) => [g.id, g.wallet_id]));
  return { index, period, range, usage: usage(s.groups, period, rows.map((r) => ({ ...r, goal_id: r.goal_id ?? null })), catGroup, goalWallets) };
}

/** Everything Budget, Rencana, Ringkasan and the notification bell read — once per request. */
export const getPlanningState = cache(async (sb: Supabase): Promise<PlanningState> => {
  const today = todayWib();
  const [profile, groups, periodRows, billRows] = await Promise.all([
    sb.from("profiles").select("payday_day").maybeSingle(),
    sb.from("budget_groups").select("id,name,icon,pct_bp,is_savings,sort").order("sort"),
    sb
      .from("budget_periods")
      .select("id,month,start_date,salary,income_tx_id,budget_allocations(group_id,amount),transactions(wallet_id)")
      .order("start_date"),
    sb.from("bills").select("id,name,icon,amount,category_id,wallet_id,cadence,due_day,next_due,remind_days,archived_at").order("next_due"),
  ]);
  const rows = must(periodRows) as unknown as PeriodRow[];
  const periods: BudgetPeriod[] = rows.map((p) => ({
    id: p.id,
    month: p.month,
    start_date: p.start_date,
    income_tx_id: p.income_tx_id,
    salary: Number(p.salary),
    allocations: Object.fromEntries(p.budget_allocations.map((a) => [a.group_id, Number(a.amount)])),
  }));
  const base = {
    today,
    payday: profile.data?.payday_day ?? 25,
    groups: must(groups) as BudgetGroup[],
    periods,
    salaryWallet: rows.at(-1)?.transactions?.wallet_id ?? null,
    bills: (must(billRows) as Bill[]).map((b) => ({ ...b, amount: Number(b.amount) })),
    goals: [] as GoalWithProgress[],
  };
  const last = periods.findLastIndex((p) => p.start_date <= today);
  const current = last >= 0 ? await loadPeriodView(sb, base, last) : null;
  return { ...base, current };
});
