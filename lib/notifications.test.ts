import { describe, expect, it } from "vitest";
import type { PosUsage } from "./budget";
import type { GoalWithProgress } from "./goals";
import { buildNotifications } from "./notifications";
import type { PlanningState } from "./planning";
import type { Bill, BudgetGroup } from "./types";

const today = "2026-10-26";
const bill = (name: string, next_due: string): Bill => ({
  id: name, name, icon: "bolt", amount: 350_000, category_id: "c", wallet_id: "bca", cadence: "monthly", due_day: 1, next_due, remind_days: 3, archived_at: null,
});
const group: BudgetGroup = { id: "makan", name: "Makanan", icon: "restaurant", pct_bp: 1500, is_savings: false, sort: 2 };
const pos = (p: Partial<PosUsage>): PosUsage => ({ group, limit: 1_000_000, used: 1_050_000, left: -50_000, pct: 105, level: "over", ...p });
const goal = (p: Partial<GoalWithProgress>): GoalWithProgress => ({
  id: "g", name: "Dana Darurat", icon: "savings", target: 24_000_000, initial_amount: 0, due_date: null, monthly_amount: 1_000_000, wallet_id: "jago",
  source_wallet_id: "bca", achieved_at: null, archived_at: null, created_at: "", saved: 0, need: 1_000_000, depositedThisPeriod: 0, status: "tertinggal", ...p,
});
const empty: PlanningState = { today, payday: 25, periodStart: "2026-10-25", groups: [], periods: [], salaryWallet: null, current: null, bills: [], goals: [] };

describe("buildNotifications", () => {
  const state: PlanningState = {
    ...empty,
    bills: [bill("Listrik", "2026-11-28"), bill("Netflix", "2026-10-28"), bill("Wifi", "2026-10-24")],
    current: { index: 0, period: { id: "p", month: "2026-09-01", start_date: "2026-09-25", salary: 1, income_tx_id: null, allocations: {} }, range: { start: "2026-09-25", end: null }, usage: { pos: [pos({})], unassigned: 0, spent: 0 } },
    periods: [{ id: "p", month: "2026-09-01", start_date: "2026-09-25", salary: 1, income_tx_id: null, allocations: {} }],
    goals: [goal({})],
  };
  const n = buildNotifications(state, today, { bca: "BCA Uji" });

  it("orders by urgency and skips bills outside the reminder window", () =>
    expect(n.map((x) => x.kind)).toEqual(["bill-late", "salary", "budget-over", "bill-soon", "goal-behind"]));
  it("writes the copy", () => {
    expect(n[0]).toMatchObject({ title: "Wifi terlambat 2 hari", body: "Rp 350.000 · BCA Uji", billId: "Wifi" });
    expect(n[1].title).toBe("Gaji Oktober belum dicatat");
    expect(n[2].title).toBe("Makanan lebih dari budget");
  });
  it("is empty when nothing needs attention", () => expect(buildNotifications(empty, "2026-10-10")).toEqual([]));
  it("asks for a deposit when on track but not yet deposited", () => {
    const d = buildNotifications({ ...empty, goals: [goal({ status: "sesuai", depositedThisPeriod: 400_000 })] }, "2026-10-10");
    expect(d).toMatchObject([{ kind: "goal-deposit", title: "Setor Dana Darurat", body: "Rp 600.000 lagi bulan ini", goalId: "g" }]);
  });
});
