import { wibDate } from "./reports";

// Category deep dive (/analitik/kategori/[id]): sort, group and chart one category's month.
type Row = { id: string; amount: number; note: string | null; occurred_at: string };
export type SortBy = "tanggal" | "nominal" | "nama";
export type Dir = "asc" | "desc";
export type Grouping = "harian" | "mingguan" | "semua";

/** Week blocks of a month by WIB date: 1–7 = 1, 8–14 = 2, … 29–31 = 5. */
export const weekOfMonth = (date: string) => Math.ceil(Number(date.slice(8, 10)) / 7);

export function sortTxs<T extends Row>(rows: T[], by: SortBy, dir: Dir): T[] {
  const sign = dir === "asc" ? 1 : -1;
  const cmp = (a: T, b: T): number => {
    if (by === "nominal") return (a.amount - b.amount) * sign;
    if (by === "nama") {
      if (!a.note !== !b.note) return a.note ? -1 : 1; // rows without a note always last
      return (a.note ?? "").localeCompare(b.note ?? "", "id", { sensitivity: "base" }) * sign;
    }
    return a.occurred_at.localeCompare(b.occurred_at) * sign;
  };
  return [...rows].sort(cmp);
}

/** Groups keep the given order of items (sort first); group order follows the date direction. */
export function groupTxs<T extends Row>(rows: T[], grouping: Grouping, dateDir: Dir): { key: string; total: number; items: T[] }[] {
  if (grouping === "semua") return [{ key: "all", total: rows.reduce((s, r) => s + r.amount, 0), items: rows }];
  const keyOf = (r: T) => (grouping === "harian" ? wibDate(r.occurred_at) : `w${weekOfMonth(wibDate(r.occurred_at))}`);
  const groups = new Map<string, { key: string; total: number; items: T[] }>();
  for (const r of rows) {
    const key = keyOf(r);
    const g = groups.get(key) ?? { key, total: 0, items: [] };
    g.total += r.amount;
    g.items.push(r);
    groups.set(key, g);
  }
  // "w10" never happens (max w5), so plain string order works for both keys
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key) * (dateDir === "asc" ? 1 : -1));
}

const daysIn = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

/** One bar per day of the month (zeros included), for the daily chart. */
export function daySeries(rows: Row[], month: string): { key: string; label: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const r of rows) totals.set(wibDate(r.occurred_at), (totals.get(wibDate(r.occurred_at)) ?? 0) + r.amount);
  return Array.from({ length: daysIn(month) }, (_, i) => {
    const key = `${month}-${String(i + 1).padStart(2, "0")}`;
    return { key, label: String(i + 1), total: totals.get(key) ?? 0 };
  });
}

/** One bar per 7-day block of the month, for the weekly chart. */
export function weekSeries(rows: Row[], month: string): { key: string; label: string; total: number }[] {
  const days = daySeries(rows, month);
  return Array.from({ length: Math.ceil(days.length / 7) }, (_, i) => {
    const slice = days.slice(i * 7, i * 7 + 7);
    return { key: `w${i + 1}`, label: `${slice[0].label}–${slice.at(-1)!.label}`, total: slice.reduce((s, d) => s + d.total, 0) };
  });
}
