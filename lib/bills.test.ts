import { describe, expect, it } from "vitest";
import { dueLabel, dueStatus, monthTotal, nextDue } from "./bills";
import type { Bill } from "./types";

describe("nextDue", () => {
  it("monthly on the 31st clamps to short months and comes back", () => {
    expect(nextDue({ cadence: "monthly", due_day: 31, next_due: "2027-01-31" })).toBe("2027-02-28");
    expect(nextDue({ cadence: "monthly", due_day: 31, next_due: "2027-02-28" })).toBe("2027-03-31");
    expect(nextDue({ cadence: "monthly", due_day: 31, next_due: "2028-01-31" })).toBe("2028-02-29");
  });
  it("yearly on 29 Feb falls back to the 28th", () => expect(nextDue({ cadence: "yearly", due_day: 29, next_due: "2028-02-29" })).toBe("2029-02-28"));
  it("weekly adds 7 days", () => expect(nextDue({ cadence: "weekly", due_day: null, next_due: "2026-10-29" })).toBe("2026-11-05"));
});

describe("dueStatus / dueLabel", () => {
  const b = (next_due: string) => ({ next_due, remind_days: 3 });
  const today = "2026-10-29";
  it("classifies by remind window", () => {
    expect(dueStatus(b("2026-10-27"), today)).toEqual({ kind: "late", days: 2 });
    expect(dueStatus(b("2026-10-29"), today)).toEqual({ kind: "soon", days: 0 });
    expect(dueStatus(b("2026-11-01"), today)).toEqual({ kind: "soon", days: 3 });
    expect(dueStatus(b("2026-11-02"), today)).toEqual({ kind: "later", days: 4 });
  });
  it("labels", () => {
    expect(dueLabel({ kind: "soon", days: 0 })).toBe("Hari ini");
    expect(dueLabel({ kind: "soon", days: 1 })).toBe("Besok");
    expect(dueLabel({ kind: "soon", days: 3 })).toBe("Dalam 3 hari");
    expect(dueLabel({ kind: "late", days: 2 })).toBe("Terlambat 2 hari");
  });
});

describe("monthTotal", () => {
  const bill = (p: Partial<Bill>): Bill => ({
    id: "x", name: "x", icon: "x", amount: 50_000, category_id: "c", wallet_id: "w", cadence: "monthly", due_day: 2, next_due: "2026-11-02", remind_days: 3, archived_at: null, ...p,
  });
  it("counts each weekly occurrence in the month", () => expect(monthTotal([bill({ cadence: "weekly", due_day: null })], "2026-11")).toBe(250_000));
  it("counts monthly once and skips yearly in other months", () => {
    expect(monthTotal([bill({ amount: 350_000 }), bill({ cadence: "yearly", next_due: "2027-03-02" })], "2026-11")).toBe(350_000);
  });
  it("ignores archived bills", () => expect(monthTotal([bill({ archived_at: "2026-10-01" })], "2026-11")).toBe(0));
});
