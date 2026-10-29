import { describe, expect, it } from "vitest";
import { daySeries, groupTxs, sortTxs, weekOfMonth, weekSeries } from "./drilldown";

// 03:00 UTC = 10:00 WIB, same calendar day
const t = (id: string, day: string, amount: number, note: string | null = null) => ({ id, amount, note, occurred_at: `${day}T03:00:00Z` });

describe("weekOfMonth", () => {
  it("splits the month into 7-day blocks by WIB date", () => {
    expect(weekOfMonth("2026-10-01")).toBe(1);
    expect(weekOfMonth("2026-10-07")).toBe(1);
    expect(weekOfMonth("2026-10-08")).toBe(2);
    expect(weekOfMonth("2026-10-31")).toBe(5);
  });
});

describe("sortTxs", () => {
  const rows = [t("a", "2026-10-05", 300, "Soto"), t("b", "2026-10-02", 100, "bakso"), t("c", "2026-10-09", 200, null)];

  it("sorts by date, amount or name in either direction", () => {
    expect(sortTxs(rows, "tanggal", "desc").map((r) => r.id)).toEqual(["c", "a", "b"]);
    expect(sortTxs(rows, "nominal", "desc").map((r) => r.id)).toEqual(["a", "c", "b"]);
    expect(sortTxs(rows, "nominal", "asc").map((r) => r.id)).toEqual(["b", "c", "a"]);
    // case-insensitive, rows without a note go last
    expect(sortTxs(rows, "nama", "asc").map((r) => r.id)).toEqual(["b", "a", "c"]);
  });

  it("does not mutate the input", () => {
    const copy = [...rows];
    sortTxs(rows, "nominal", "asc");
    expect(rows).toEqual(copy);
  });
});

describe("groupTxs", () => {
  const rows = [t("a", "2026-10-05", 300), t("b", "2026-10-05", 100), t("c", "2026-10-09", 200), t("d", "2026-10-31", 50)];

  it("groups by day with subtotals, newest group first by default", () => {
    const g = groupTxs(rows, "harian", "desc");
    expect(g.map((x) => [x.key, x.total, x.items.length])).toEqual([
      ["2026-10-31", 50, 1],
      ["2026-10-09", 200, 1],
      ["2026-10-05", 400, 2],
    ]);
  });

  it("groups by week of the month, oldest first when ascending", () => {
    const g = groupTxs(rows, "mingguan", "asc");
    expect(g.map((x) => [x.key, x.total])).toEqual([
      ["w1", 400],
      ["w2", 200],
      ["w5", 50],
    ]);
  });

  it("keeps one flat group for 'semua'", () => {
    expect(groupTxs(rows, "semua", "desc")).toHaveLength(1);
  });
});

describe("series", () => {
  const rows = [t("a", "2026-10-05", 300), t("b", "2026-10-05", 100), t("c", "2026-10-30", 200)];

  it("has one bar per day of the month, zeros included", () => {
    const s = daySeries(rows, "2026-10");
    expect(s).toHaveLength(31);
    expect(s[4]).toEqual({ key: "2026-10-05", label: "5", total: 400 });
    expect(s[0].total).toBe(0);
  });

  it("has one bar per week block", () => {
    expect(weekSeries(rows, "2026-10").map((w) => [w.key, w.total])).toEqual([
      ["w1", 400],
      ["w2", 0],
      ["w3", 0],
      ["w4", 0],
      ["w5", 200],
    ]);
  });

  it("knows February is short", () => {
    expect(daySeries([], "2026-02")).toHaveLength(28);
    expect(weekSeries([], "2026-02")).toHaveLength(4);
  });
});
