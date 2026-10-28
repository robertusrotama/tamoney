import type { Tx } from "./types";

export type ReportTx = Pick<Tx, "kind" | "amount" | "occurred_at" | "category_id"> & { category_name?: string };

// Asia/Jakarta is a fixed UTC+7 with no DST, so a constant offset is exact.
const WIB_MS = 7 * 60 * 60 * 1000;

export function wibDate(iso: string): string {
  return new Date(new Date(iso).getTime() + WIB_MS).toISOString().slice(0, 10);
}

export function monthKey(iso: string): string {
  return wibDate(iso).slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function monthRange(month: string): { start: string; end: string } {
  const startOf = (mo: string) => new Date(Date.parse(`${mo}-01T00:00:00Z`) - WIB_MS).toISOString();
  return { start: startOf(month), end: startOf(shiftMonth(month, 1)) };
}

export function monthTotals(txs: ReportTx[]): { income: number; expense: number; net: number } {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.kind === "income") income += t.amount;
    else if (t.kind === "expense") expense += t.amount;
  }
  return { income, expense, net: income - expense };
}

export function monthlyTrend(
  txs: ReportTx[],
  endMonth: string,
  n = 6,
): { month: string; income: number; expense: number }[] {
  const months = Array.from({ length: n }, (_, i) => shiftMonth(endMonth, i - n + 1));
  return months.map((month) => {
    const { income, expense } = monthTotals(txs.filter((t) => monthKey(t.occurred_at) === month));
    return { month, income, expense };
  });
}

export function categoryBreakdown(
  txs: ReportTx[],
  prevTxs: ReportTx[],
): { categoryId: string; name: string; amount: number; share: number; deltaVsPrev: number | null }[] {
  const sumByCategory = (list: ReportTx[]) => {
    const m = new Map<string, { name: string; amount: number }>();
    for (const t of list) {
      if (t.kind !== "expense" || !t.category_id) continue;
      const cur = m.get(t.category_id) ?? { name: t.category_name ?? "Lainnya", amount: 0 };
      cur.amount += t.amount;
      m.set(t.category_id, cur);
    }
    return m;
  };
  const now = sumByCategory(txs);
  const prev = sumByCategory(prevTxs);
  const total = [...now.values()].reduce((s, c) => s + c.amount, 0);
  return [...now.entries()]
    .map(([categoryId, c]) => ({
      categoryId,
      name: c.name,
      amount: c.amount,
      share: c.amount / total,
      deltaVsPrev: pctChange(c.amount, prev.get(categoryId)?.amount ?? 0),
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function pctChange(cur: number, prev: number): number | null {
  return prev === 0 ? null : (cur - prev) / prev;
}
