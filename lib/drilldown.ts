import { bucketKey, type Unit } from "./period";

// Category deep dive (/analitik/kategori/[id]): sort and group one category's rows.
type Row = { id: string; amount: number; note: string | null; occurred_at: string };
export type SortBy = "tanggal" | "nominal" | "nama";
export type Dir = "asc" | "desc";
export type Grouping = Unit | "semua";

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
  const groups = new Map<string, { key: string; total: number; items: T[] }>();
  for (const r of rows) {
    const key = bucketKey(r.occurred_at, grouping);
    const g = groups.get(key) ?? { key, total: 0, items: [] };
    g.total += r.amount;
    g.items.push(r);
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key) * (dateDir === "asc" ? 1 : -1));
}
