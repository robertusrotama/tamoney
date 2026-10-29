import { describe, expect, it } from "vitest";
import { goalStatus, monthlyNeed, paydaysUntil, periodNeed, saved, type GoalTx } from "./goals";
import type { Goal } from "./types";

const goal = (p: Partial<Goal> = {}): Goal => ({
  id: "g1", name: "Dana Darurat", icon: "savings", target: 24_000_000, initial_amount: 0, due_date: null, monthly_amount: null,
  wallet_id: "jago", source_wallet_id: "bca", achieved_at: null, archived_at: null, created_at: "2026-10-01T00:00:00Z", ...p,
});
const tx = (p: Partial<GoalTx>): GoalTx => ({ goal_id: "g1", kind: "transfer", amount: 0, wallet_id: "bca", to_wallet_id: "jago", occurred_at: "2026-10-26T00:00:00Z", ...p });

describe("saved", () => {
  it("initial + deposits − withdrawals; other transfers ignored", () => {
    const txs = [tx({ amount: 500_000 }), tx({ amount: 200_000, wallet_id: "jago", to_wallet_id: "bca" }), tx({ goal_id: null, amount: 9_000_000 })];
    expect(saved(goal({ initial_amount: 1_000_000 }), txs)).toBe(1_300_000);
  });
});

describe("paydaysUntil", () => {
  it("counts paydays after today up to the due date", () => expect(paydaysUntil("2026-10-29", "2027-04-30", 25)).toBe(6));
  it("is at least 1", () => expect(paydaysUntil("2026-10-29", "2026-11-01", 25)).toBe(1));
});

describe("monthlyNeed", () => {
  it("splits what is left over the paydays until due", () => expect(monthlyNeed(goal({ due_date: "2027-04-30" }), 0, "2026-10-29", 25)).toBe(4_000_000));
  it("rounds up to Rp 1.000", () => expect(monthlyNeed(goal({ target: 1_000_000, due_date: "2027-01-30" }), 0, "2026-10-29", 25)).toBe(334_000));
  it("is 0 once reached", () => expect(monthlyNeed(goal({ due_date: "2027-04-30" }), 30_000_000, "2026-10-29", 25)).toBe(0));
  it("uses the fixed monthly amount without a due date", () => expect(monthlyNeed(goal({ monthly_amount: 1_500_000 }), 0, "2026-10-29", 25)).toBe(1_500_000));
});

describe("goalStatus", () => {
  const base = { target: 10, saved: 5, need: 3, depositedThisPeriod: 0, due: "2027-04-30", today: "2026-11-21", periodEnd: "2026-11-24" };
  it("reached", () => expect(goalStatus({ ...base, saved: 10 })).toBe("tercapai"));
  it("behind when the due date passed", () => expect(goalStatus({ ...base, due: "2026-11-01" })).toBe("tertinggal"));
  it("behind when the period ends soon without the deposit", () => expect(goalStatus(base)).toBe("tertinggal"));
  it("on track early in the period", () => expect(goalStatus({ ...base, today: "2026-11-04" })).toBe("sesuai"));
  it("on track once this period's deposit is in", () => expect(goalStatus({ ...base, depositedThisPeriod: 3 })).toBe("sesuai"));
});

describe("periodNeed", () => {
  it("counts the current period once even when the salary came after payday", () =>
    expect(periodNeed(goal({ target: 3_000_000, due_date: "2026-12-25" }), 0, "2026-10-01", 25)).toBe(1_000_000));
  it("fixed monthly amount never asks for more than is left", () =>
    expect(monthlyNeed(goal({ target: 1_000_000, monthly_amount: 1_000_000 }), 800_000, "2026-10-29", 25)).toBe(200_000));
});
