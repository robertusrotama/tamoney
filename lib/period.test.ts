import { describe, expect, it } from "vitest";
import { commonRanges, filterRows, lastN, periodFromParams, periodParams, series } from "./period";

const today = "2026-10-29"; // a Thursday

describe("periodFromParams", () => {
  it("defaults to this month", () => {
    const p = periodFromParams({}, today);
    expect([p.kind, p.start, p.end, p.label]).toEqual(["bulan", "2026-10-01", "2026-10-31", "Oktober 2026"]);
    expect(p.canNext).toBe(false);
  });

  it("weeks run Monday to Sunday", () => {
    const p = periodFromParams({ p: "minggu", d: "2026-10-29" }, today);
    expect([p.start, p.end, p.label]).toEqual(["2026-10-26", "2026-11-01", "26 Okt – 1 Nov 2026"]);
    expect(periodFromParams({ p: "minggu", d: "2026-11-01" }, today).start).toBe("2026-10-26"); // Sunday → same week
  });

  it("previous period has the same shape", () => {
    expect(periodFromParams({ p: "minggu", d: "2026-10-29" }, today).prev).toEqual({ start: "2026-10-19", end: "2026-10-25" });
    expect(periodFromParams({ p: "bulan", d: "2026-03-15" }, today).prev).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(periodFromParams({ p: "tahun", d: "2026-05-01" }, today)).toMatchObject({ start: "2026-01-01", end: "2026-12-31", label: "2026" });
  });

  it("custom range: inclusive, previous range of equal length, swapped if reversed", () => {
    const p = periodFromParams({ p: "rentang", dari: "2026-10-10", sampai: "2026-10-01" }, today);
    expect([p.start, p.end]).toEqual(["2026-10-01", "2026-10-10"]);
    expect(p.prev).toEqual({ start: "2026-09-21", end: "2026-09-30" });
  });

  it("keeps old ?bulan= links working and ignores junk", () => {
    expect(periodFromParams({ bulan: "2026-09" }, today).start).toBe("2026-09-01");
    expect(periodFromParams({ p: "minggu", d: "nope" }, today).start).toBe("2026-10-26");
  });

  it("steps to neighbouring periods", () => {
    const p = periodFromParams({ p: "bulan", d: "2026-09-10" }, today);
    expect(periodParams(p, -1)).toEqual({ p: "bulan", d: "2026-08-01" });
    expect(periodParams(p, 1)).toEqual({ p: "bulan", d: "2026-10-01" });
    expect(p.canNext).toBe(true);
  });
});

describe("series", () => {
  const rows = [
    { amount: 100, occurred_at: "2026-10-26T03:00:00Z" }, // Mon
    { amount: 50, occurred_at: "2026-10-27T03:00:00Z" },
    { amount: 30, occurred_at: "2026-11-01T16:30:00Z" }, // 23:30 WIB Sun 1 Nov
  ];

  it("buckets by day across the range, zeros included", () => {
    const s = series(rows, "2026-10-26", "2026-11-01", "hari");
    expect(s.map((b) => b.total)).toEqual([100, 50, 0, 0, 0, 0, 30]);
  });

  it("buckets by Monday-start week and by month", () => {
    expect(series(rows, "2026-10-20", "2026-11-03", "minggu").map((b) => [b.key, b.total])).toEqual([
      ["2026-10-19", 0],
      ["2026-10-26", 180],
      ["2026-11-02", 0],
    ]);
    expect(series(rows, "2026-10-01", "2026-11-30", "bulan").map((b) => [b.key, b.total])).toEqual([
      ["2026-10", 150],
      ["2026-11", 30],
    ]);
  });
});

describe("filterRows", () => {
  const rows = [
    { kind: "expense", category_id: "food", category_name: "Makan", wallet_id: "bri", to_wallet_id: null, note: "Mie ayam" },
    { kind: "income", category_id: "gaji", category_name: "Gaji", wallet_id: "bca", to_wallet_id: null, note: null },
    { kind: "transfer", category_id: null, category_name: null, wallet_id: "bca", to_wallet_id: "bri", note: "Isi saldo" },
  ] as const;

  it("matches any of the selected categories and wallets (both sides of a transfer)", () => {
    expect(filterRows([...rows], { categories: ["food", "gaji"] })).toHaveLength(2);
    expect(filterRows([...rows], { wallets: ["bri"] })).toHaveLength(2);
  });

  it("filters by a single kind and by search text", () => {
    expect(filterRows([...rows], { kind: "transfer" })).toHaveLength(1);
    expect(filterRows([...rows], { q: "MIE" })).toHaveLength(1);
    expect(filterRows([...rows], { q: "gaji" })).toHaveLength(1); // category name counts
    expect(filterRows([...rows], {})).toHaveLength(3);
  });
});

describe("quick ranges", () => {
  it("last N units end today", () => {
    expect(lastN(today, 7, "hari")).toEqual({ p: "rentang", dari: "2026-10-23", sampai: today });
    expect(lastN(today, 2, "minggu")).toEqual({ p: "rentang", dari: "2026-10-16", sampai: today });
    expect(lastN(today, 3, "bulan")).toEqual({ p: "rentang", dari: "2026-07-30", sampai: today });
    expect(lastN(today, 1, "tahun")).toEqual({ p: "rentang", dari: "2025-10-30", sampai: today });
  });
  it("month ends clamp (31 Mar minus 1 month)", () => expect(lastN("2026-03-31", 1, "bulan").dari).toBe("2026-03-01"));
  it("commonly used presets map to period params", () => {
    const c = Object.fromEntries(commonRanges(today).map((r) => [r.label, r.params]));
    expect(c["Hari ini"]).toEqual({ p: "rentang", dari: today, sampai: today });
    expect(c["Bulan ini"]).toEqual({ p: "bulan", d: today });
    expect(c["Bulan lalu"]).toEqual({ p: "bulan", d: "2026-09-01" });
    expect(c["Tahun lalu"]).toEqual({ p: "tahun", d: "2025-01-01" });
  });
});
