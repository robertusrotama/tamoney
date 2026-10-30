import { describe, expect, it } from "vitest";
import type { BudgetGroup, BudgetPeriod } from "./types";
import { allocate, DEFAULT_POS, groupsFor, nominalEnd, withTopup, periodRange, safePerDay, usage, type UsageRow } from "./budget";

const groups: BudgetGroup[] = DEFAULT_POS.map((p, i) => ({ ...p, id: p.name, sort: i }));

describe("allocate", () => {
  it("splits 12 jt exactly like the analysis table", () => {
    expect(allocate(12_000_000, groups)).toEqual({
      "Tabungan & Investasi": 4_000_000,
      "Rumah & Kost": 2_400_000,
      Makanan: 1_800_000,
      Groceries: 900_000,
      Transportasi: 600_000,
      Belanja: 600_000,
      Kesehatan: 500_000,
      Hiburan: 400_000,
      Langganan: 300_000,
      "Gereja & Sosial": 300_000,
      "Lain-lain": 200_000,
    });
  });

  it("always sums to the salary, rounding other pos to Rp 10.000", () => {
    const a = allocate(12_345_678, groups);
    expect(Object.values(a).reduce((s, v) => s + v, 0)).toBe(12_345_678);
    for (const g of groups.filter((g) => !g.is_savings)) expect(a[g.id] % 10_000).toBe(0);
  });

  it("trims the largest pos when percentages overshoot, never going negative", () => {
    const a = allocate(1_000_000, [
      { id: "a", pct_bp: 9000, is_savings: false },
      { id: "b", pct_bp: 5000, is_savings: false },
      { id: "s", pct_bp: 0, is_savings: true },
    ]);
    expect(a.s).toBe(0);
    expect(a.a + a.b).toBe(1_000_000);
    expect(Math.min(...Object.values(a))).toBeGreaterThanOrEqual(0);
  });
});

describe("periods", () => {
  it("nominal end is the day before next month's payday", () => {
    expect(nominalEnd("2026-10-25", 25)).toBe("2026-11-24");
    expect(nominalEnd("2027-01-25", 25)).toBe("2027-02-24");
  });

  const period = (month: string, start_date: string): BudgetPeriod => ({ id: month, month, start_date, salary: 1, income_tx_id: null, allocations: {} });

  it("a period runs until the next salary, even a late one", () => {
    const ps = [period("2026-10-01", "2026-10-25"), period("2026-11-01", "2026-11-27")];
    expect(periodRange(ps, 0)).toEqual({ start: "2026-10-25", end: "2026-11-26" });
    expect(periodRange(ps, 1)).toEqual({ start: "2026-11-27", end: null });
  });
});

describe("usage", () => {
  const p: BudgetPeriod = {
    id: "p",
    month: "2026-10-01",
    start_date: "2026-10-25",
    salary: 12_000_000,
    income_tx_id: null,
    allocations: allocate(12_000_000, groups),
  };
  const catGroup = { makan: "Makanan", investasi: "Tabungan & Investasi", aneh: null };
  const row = (r: Partial<UsageRow>): UsageRow => ({ kind: "expense", amount: 0, category_id: null, wallet_id: "bca", to_wallet_id: null, goal_id: null, ...r });
  const rows = [
    row({ category_id: "makan", amount: 1_500_000 }),
    row({ category_id: "aneh", amount: 70_000 }),
    row({ kind: "transfer", amount: 1_000_000, wallet_id: "bca", to_wallet_id: "jago", goal_id: "g1" }),
    row({ kind: "transfer", amount: 200_000, wallet_id: "jago", to_wallet_id: "bca", goal_id: "g1" }),
    row({ kind: "transfer", amount: 999_000, wallet_id: "bca", to_wallet_id: "gopay" }),
    row({ kind: "income", amount: 12_000_000, category_id: null }),
  ];
  const u = usage(groups, p, rows, catGroup, { g1: "jago" });
  const pos = (name: string) => u.pos.find((x) => x.group.id === name)!;

  it("counts expenses in their pos and flags 80%", () => {
    expect(pos("Makanan")).toMatchObject({ limit: 1_800_000, used: 1_500_000, left: 300_000, level: "warn" });
  });
  it("puts unmapped categories in unassigned", () => expect(u.unassigned).toBe(70_000));
  it("savings = goal deposits minus withdrawals; plain transfers count nowhere", () => {
    expect(pos("Tabungan & Investasi").used).toBe(800_000);
    expect(u.spent).toBe(1_570_000);
  });
  it("over 100% is over", () => {
    const o = usage(groups, p, [row({ category_id: "makan", amount: 1_900_000 })], catGroup, {});
    expect(o.pos.find((x) => x.group.id === "Makanan")!.level).toBe("over");
  });
});

describe("safePerDay", () => {
  it("divides what is left by the days remaining, today included", () => {
    const pos = [
      { group: groups[1], limit: 1_000_000, used: 400_000, left: 600_000, pct: 40, level: "ok" as const },
      { group: groups[2], limit: 100, used: 200, left: -100, pct: 200, level: "over" as const },
      { group: groups[0], limit: 4_000_000, used: 0, left: 4_000_000, pct: 0, level: "ok" as const },
    ];
    expect(safePerDay(pos, "2026-11-19", "2026-11-24")).toBe(100_000);
  });
});

describe("groupsFor", () => {
  it("keeps an archived pos in periods that allocated it, hides it elsewhere", () => {
    const gs = [{ ...groups[1] }, { ...groups[7], archived_at: "2026-11-01T00:00:00Z" }];
    const oct = { id: "p", month: "2026-10-01", start_date: "2026-10-25", salary: 1, income_tx_id: null, allocations: { [groups[7].id]: 400_000 } };
    const nov = { ...oct, allocations: {} };
    expect(groupsFor(gs, oct).map((g) => g.id)).toEqual([groups[1].id, groups[7].id]);
    expect(groupsFor(gs, nov).map((g) => g.id)).toEqual([groups[1].id]);
  });
});

describe("withTopup", () => {
  it("splits extra income across pos by percentage and keeps totals exact", () => {
    const base = allocate(12_000_000, groups);
    const out = withTopup(base, 1_000_000, groups);
    expect(Object.values(out).reduce((a, b) => a + b, 0)).toBe(13_000_000);
    expect(out["Makanan"]).toBe(base["Makanan"] + 150_000);
    expect(out["Tabungan & Investasi"] - base["Tabungan & Investasi"]).toBe(320_000); // rounding remainders land in savings
  });
  it("no topup leaves the allocations untouched", () => expect(withTopup({ a: 5 }, 0, groups)).toEqual({ a: 5 }));
});

describe("usage with refunds", () => {
  it("a refund lowers the pos it came from", () => {
    const p = { id: "p", month: "2026-10-01", start_date: "2026-10-25", salary: 12_000_000, income_tx_id: null, allocations: allocate(12_000_000, groups) };
    const rows: UsageRow[] = [
      { kind: "expense", amount: 200_000, category_id: "makan", wallet_id: "bca", to_wallet_id: null, goal_id: null },
      { kind: "income", amount: 150_000, category_id: "makan", wallet_id: "bca", to_wallet_id: null, goal_id: null, reimburses_id: "x" },
    ];
    const u = usage(groups, p, rows, { makan: "Makanan" }, {});
    expect(u.pos.find((x) => x.group.id === "Makanan")!.used).toBe(50_000);
    expect(u.spent).toBe(50_000);
  });
});
