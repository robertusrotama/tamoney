import { describe, expect, it } from "vitest";
import {
  categoryBreakdown,
  monthKey,
  monthlyTrend,
  monthRange,
  monthTotals,
  pctChange,
  shiftMonth,
  toOccurredAt,
  todayWib,
  wibDate,
  wibGreeting,
  type ReportTx,
} from "./reports";

const at = "2026-10-05T03:00:00Z";
const inc = (amount: number, occurred_at = at): ReportTx => ({ kind: "income", amount, occurred_at, category_id: "gaji", category_name: "Gaji" });
const exp = (amount: number, cat = "A", occurred_at = at): ReportTx => ({ kind: "expense", amount, occurred_at, category_id: cat, category_name: cat });
const transfer = (amount: number): ReportTx => ({ kind: "transfer", amount, occurred_at: at, category_id: null });

describe("WIB date helpers", () => {
  it("keeps 23:30 WIB on the same day", () => {
    expect(wibDate("2026-10-31T16:30:00Z")).toBe("2026-10-31");
  });

  it("moves 00:30 WIB on the 1st into the new month", () => {
    expect(monthKey("2026-10-31T17:30:00Z")).toBe("2026-11");
  });

  it("gives UTC bounds of a WIB month, end exclusive", () => {
    expect(monthRange("2026-10")).toEqual({ start: "2026-09-30T17:00:00.000Z", end: "2026-10-31T17:00:00.000Z" });
  });

  it("shifts months across years", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2025-12", 1)).toBe("2026-01");
  });
});

describe("toOccurredAt", () => {
  const now = new Date("2026-10-29T05:15:00Z"); // 12:15 WIB

  it("stamps a picked date with the current WIB time", () => {
    expect(toOccurredAt("2026-10-20", undefined, now)).toBe("2026-10-20T05:15:00.000Z");
  });

  it("keeps the original timestamp when an edit leaves the date unchanged", () => {
    expect(toOccurredAt("2026-10-31", "2026-10-31T16:30:00Z", now)).toBe("2026-10-31T16:30:00Z");
  });

  it("gives today in WIB", () => {
    expect(todayWib(new Date("2026-10-31T17:30:00Z"))).toBe("2026-11-01");
  });
});

describe("wibGreeting", () => {
  it("follows the WIB clock", () => {
    expect(wibGreeting(new Date("2026-10-29T01:00:00Z"))).toBe("Selamat Pagi"); // 08:00
    expect(wibGreeting(new Date("2026-10-29T05:00:00Z"))).toBe("Selamat Siang"); // 12:00
    expect(wibGreeting(new Date("2026-10-29T09:00:00Z"))).toBe("Selamat Sore"); // 16:00
    expect(wibGreeting(new Date("2026-10-29T13:00:00Z"))).toBe("Selamat Malam"); // 20:00
    expect(wibGreeting(new Date("2026-10-28T20:00:00Z"))).toBe("Selamat Pagi"); // 03:00
  });
});

describe("monthTotals", () => {
  it("ignores transfers", () => {
    expect(monthTotals([inc(100), exp(40), transfer(500)])).toEqual({ income: 100, expense: 40, net: 60 });
  });
});

describe("monthlyTrend", () => {
  it("returns n ascending months with empty months as zero", () => {
    const trend = monthlyTrend([exp(10, "A", "2026-10-05T03:00:00Z"), inc(70, "2026-08-02T03:00:00Z")], "2026-10", 3);
    expect(trend).toEqual([
      { month: "2026-08", income: 70, expense: 0 },
      { month: "2026-09", income: 0, expense: 0 },
      { month: "2026-10", income: 0, expense: 10 },
    ]);
  });
});

describe("categoryBreakdown", () => {
  it("ranks expense categories with share and change vs previous month", () => {
    const b = categoryBreakdown([exp(100, "B"), exp(300, "A"), inc(999), transfer(50)], [exp(150, "A")]);
    expect(b.map((x) => x.name)).toEqual(["A", "B"]);
    expect(b[0].amount).toBe(300);
    expect(b[0].share).toBeCloseTo(0.75);
    expect(b[0].deltaVsPrev).toBeCloseTo(1);
    expect(b[1].deltaVsPrev).toBeNull();
  });

  it("returns an empty list when there are no expenses", () => {
    expect(categoryBreakdown([inc(10)], [])).toEqual([]);
  });
});

describe("pctChange", () => {
  it("is null when the previous value is zero", () => {
    expect(pctChange(110, 100)).toBeCloseTo(0.1);
    expect(pctChange(5, 0)).toBeNull();
  });
});
