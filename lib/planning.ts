import "server-only";
import { cache } from "react";
import { nominalEnd, periodRange, usage } from "./budget";
import { deposited, goalStatus, monthlyNeed, saved, type GoalTx, type GoalWithProgress } from "./goals";
import { addDays, isoRange } from "./period";
import { getCategories, getTransactionsBetween } from "./queries";
import { todayWib, wibDate } from "./reports";
import type { Supabase } from "./supabase/server";
import type { Bill, BudgetGroup, BudgetPeriod, Goal } from "./types";

/** Payday of the month before `today`'s month. */
const nominalStart = (today: string, payday: number) => {
  const [y, m] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 2, payday)).toISOString().slice(0, 10);
};

export type PeriodView = {
  index: number;
  period: BudgetPeriod;
  range: { start: string; end: string | null };
  usage: ReturnType<typeof usage>;
};

export type PlanningState = {
  today: string;
  payday: number;
  /** Start of the salary period goals are measured in (actual or nominal). */
  periodStart: string;
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
  const [profile, groups, periodRows, billRows, goalRows, goalTxRows] = await Promise.all([
    sb.from("profiles").select("payday_day").maybeSingle(),
    sb.from("budget_groups").select("id,name,icon,pct_bp,is_savings,sort").order("sort"),
    sb
      .from("budget_periods")
      .select("id,month,start_date,salary,income_tx_id,budget_allocations(group_id,amount),transactions(wallet_id)")
      .order("start_date"),
    sb.from("bills").select("id,name,icon,amount,category_id,wallet_id,cadence,due_day,next_due,remind_days,archived_at").order("next_due"),
    sb
      .from("goals")
      .select("id,name,icon,target,initial_amount,due_date,monthly_amount,wallet_id,source_wallet_id,achieved_at,archived_at,created_at")
      .order("created_at"),
    sb.from("transactions").select("goal_id,kind,amount,wallet_id,to_wallet_id,occurred_at").not("goal_id", "is", null),
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
  const payday = profile.data?.payday_day ?? 25;
  const last = periods.findLastIndex((p) => p.start_date <= today);
  // The goal "month" is the salary period; before any salary is recorded, the nominal one around today.
  const periodStart =
    last >= 0 ? periods[last].start_date : Number(today.slice(8)) >= payday ? `${today.slice(0, 8)}${String(payday).padStart(2, "0")}` : nominalStart(today, payday);
  const periodEnd = periods[last + 1] && last >= 0 ? addDays(periods[last + 1].start_date, -1) : nominalEnd(periodStart, payday);
  const goalTxs = (must(goalTxRows) as GoalTx[]).map((t) => ({ ...t, amount: Number(t.amount) }));
  const goals = (must(goalRows) as Goal[]).map((raw): GoalWithProgress => {
    const g = { ...raw, target: Number(raw.target), initial_amount: Number(raw.initial_amount), monthly_amount: raw.monthly_amount === null ? null : Number(raw.monthly_amount) };
    const total = saved(g, goalTxs);
    const depositedThisPeriod = deposited(g, goalTxs.filter((t) => wibDate(t.occurred_at) >= periodStart));
    // Need is fixed for the whole period: counted from before this period's deposits, this period included.
    const need = monthlyNeed(g, total - depositedThisPeriod, addDays(periodStart, -1), payday);
    return { ...g, saved: total, need, depositedThisPeriod, status: goalStatus({ target: g.target, saved: total, need, depositedThisPeriod, due: g.due_date, today, periodEnd }) };
  });
  const base = {
    today,
    payday,
    periodStart,
    groups: must(groups) as BudgetGroup[],
    periods,
    salaryWallet: rows.at(-1)?.transactions?.wallet_id ?? null,
    bills: (must(billRows) as Bill[]).map((b) => ({ ...b, amount: Number(b.amount) })),
    goals,
  };
  const current = last >= 0 ? await loadPeriodView(sb, base, last) : null;
  return { ...base, current };
});
