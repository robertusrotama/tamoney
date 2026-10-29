import { describe, expect, it } from "vitest";
import { groupTxs, sortTxs } from "./drilldown";

// 03:00 UTC = 10:00 WIB, same calendar day
const t = (id: string, day: string, amount: number, note: string | null = null) => ({ id, amount, note, occurred_at: `${day}T03:00:00Z` });

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
    const g = groupTxs(rows, "hari", "desc");
    expect(g.map((x) => [x.key, x.total, x.items.length])).toEqual([
      ["2026-10-31", 50, 1],
      ["2026-10-09", 200, 1],
      ["2026-10-05", 400, 2],
    ]);
  });

  it("groups by Monday-start week, oldest first when ascending", () => {
    const g = groupTxs(rows, "minggu", "asc");
    expect(g.map((x) => [x.key, x.total])).toEqual([
      ["2026-10-05", 600], // Mon 5 Oct – Sun 11 Oct
      ["2026-10-26", 50],
    ]);
  });

  it("groups by month", () => {
    expect(groupTxs(rows, "bulan", "desc").map((x) => [x.key, x.total])).toEqual([["2026-10", 650]]);
  });

  it("keeps one flat group for 'semua'", () => {
    expect(groupTxs(rows, "semua", "desc")).toHaveLength(1);
  });
});

