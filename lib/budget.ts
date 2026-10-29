import { addDays } from "./period";
import type { BudgetGroup, BudgetPeriod, TxKind } from "./types";

// Payday budget (spec §4). Dates are WIB "YYYY-MM-DD".

/** Default pos — mirrors seed_budget() in supabase/migrations/20261029060000_budget_bills_goals.sql. */
export const DEFAULT_POS: Omit<BudgetGroup, "id" | "sort">[] = [
  { name: "Tabungan & Investasi", icon: "savings", pct_bp: 3333, is_savings: true },
  { name: "Rumah & Kost", icon: "home", pct_bp: 2000, is_savings: false },
  { name: "Makanan", icon: "restaurant", pct_bp: 1500, is_savings: false },
  { name: "Groceries", icon: "shopping_cart", pct_bp: 750, is_savings: false },
  { name: "Transportasi", icon: "directions_car", pct_bp: 500, is_savings: false },
  { name: "Belanja", icon: "shopping_bag", pct_bp: 500, is_savings: false },
  { name: "Kesehatan", icon: "medical_services", pct_bp: 417, is_savings: false },
  { name: "Hiburan", icon: "movie", pct_bp: 333, is_savings: false },
  { name: "Langganan", icon: "subscriptions", pct_bp: 250, is_savings: false },
  { name: "Gereja & Sosial", icon: "volunteer_activism", pct_bp: 250, is_savings: false },
  { name: "Lain-lain", icon: "more_horiz", pct_bp: 167, is_savings: false },
];

/** Default category name → pos name (same table as the seed). */
export const DEFAULT_CATEGORY_MAP: Record<string, string> = {
  Investasi: "Tabungan & Investasi",
  "Kost & Rumah": "Rumah & Kost",
  "Tagihan & Utilitas": "Rumah & Kost",
  "Makan & Minum": "Makanan",
  Groceries: "Groceries",
  Transportasi: "Transportasi",
  Belanja: "Belanja",
  Kesehatan: "Kesehatan",
  Hiburan: "Hiburan",
  Langganan: "Langganan",
  Gereja: "Gereja & Sosial",
  Lainnya: "Lain-lain",
  "Tarik Tunai": "Lain-lain",
};

const STEP = 10_000;

/**
 * Salary → rupiah per pos. Other pos round to Rp 10.000; savings takes the remainder, so the total is
 * always exactly the salary. If percentages overshoot, the largest pos are trimmed until savings is 0.
 */
export function allocate(salary: number, groups: Pick<BudgetGroup, "id" | "pct_bp" | "is_savings">[]): Record<string, number> {
  const out: Record<string, number> = {};
  const others = groups.filter((g) => !g.is_savings);
  for (const g of others) out[g.id] = Math.round((salary * g.pct_bp) / 10_000 / STEP) * STEP;
  let rest = salary - others.reduce((s, g) => s + out[g.id], 0);
  while (rest < 0) {
    const big = others.reduce((a, b) => (out[b.id] > out[a.id] ? b : a));
    const cut = Math.min(out[big.id], -rest);
    out[big.id] -= cut;
    rest += cut;
  }
  const savings = groups.find((g) => g.is_savings);
  if (savings) out[savings.id] = rest;
  else if (others.length) out[others[0].id] += rest;
  return out;
}

/** Pos shown for a period: active ones, plus archived ones that period still allocated (past months never change). */
export function groupsFor<G extends BudgetGroup>(groups: G[], period: BudgetPeriod): G[] {
  return groups.filter((g) => !g.archived_at || g.id in period.allocations);
}

/** Day before the payday of the month after `start` ("25 Okt – 24 Nov"). */
export function nominalEnd(start: string, payday: number): string {
  const [y, m] = start.split("-").map(Number);
  const next = new Date(Date.UTC(y, m, payday)).toISOString().slice(0, 10);
  return addDays(next, -1);
}

/** Periods sorted by start_date; a period ends the day before the next one starts (null = still running). */
export function periodRange(periods: BudgetPeriod[], i: number): { start: string; end: string | null } {
  const next = periods[i + 1];
  return { start: periods[i].start_date, end: next ? addDays(next.start_date, -1) : null };
}

export type UsageRow = {
  kind: TxKind;
  amount: number;
  category_id: string | null;
  wallet_id: string;
  to_wallet_id: string | null;
  goal_id: string | null;
};
export type PosUsage = { group: BudgetGroup; limit: number; used: number; left: number; pct: number; level: "ok" | "warn" | "over" | "saved" };

/**
 * What each pos used of its allocation. `rows` are the period's transactions; `catGroup` maps category id →
 * pos id; `goalWallets` maps goal id → its wallet. Savings counts goal deposits minus withdrawals.
 */
export function usage(
  groups: BudgetGroup[],
  period: BudgetPeriod,
  rows: UsageRow[],
  catGroup: Record<string, string | null>,
  goalWallets: Record<string, string>,
): { pos: PosUsage[]; unassigned: number; spent: number } {
  const used: Record<string, number> = {};
  let unassigned = 0;
  const savings = groups.find((g) => g.is_savings);
  for (const r of rows) {
    if (r.kind === "expense" && r.category_id) {
      const g = catGroup[r.category_id];
      if (g) used[g] = (used[g] ?? 0) + r.amount;
      else unassigned += r.amount;
    } else if (r.kind === "transfer" && r.goal_id && savings) {
      const w = goalWallets[r.goal_id];
      const sign = r.to_wallet_id === w ? 1 : r.wallet_id === w ? -1 : 0;
      used[savings.id] = (used[savings.id] ?? 0) + sign * r.amount;
    }
  }
  const pos = groups.map((group): PosUsage => {
    const limit = period.allocations[group.id] ?? 0;
    const u = used[group.id] ?? 0;
    const pct = limit ? Math.round((u / limit) * 100) : u > 0 ? 100 : 0;
    const level = group.is_savings ? (u >= limit && limit > 0 ? "saved" : "ok") : u > limit ? "over" : pct >= 80 ? "warn" : "ok";
    return { group, limit, used: u, left: limit - u, pct, level };
  });
  const spent = pos.filter((p) => !p.group.is_savings).reduce((s, p) => s + p.used, 0) + unassigned;
  return { pos, unassigned, spent };
}

/** What can still be spent per day: positive leftovers of non-savings pos ÷ days left (today included). */
export function safePerDay(pos: PosUsage[], today: string, end: string): number {
  const days = Math.round((new Date(`${end}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000) + 1;
  const left = pos.filter((p) => !p.group.is_savings).reduce((s, p) => s + Math.max(0, p.left), 0);
  return days > 0 ? Math.floor(left / days) : 0;
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("id-ID", { ...opts, timeZone: "UTC" });
/** "2026-10-01" or "2026-10" → "Oktober 2026" */
export const monthLabel = (month: string) => fmt({ month: "long", year: "numeric" }).format(new Date(`${month.slice(0, 7)}-01T00:00:00Z`));
/** "25 Okt – 24 Nov" */
export const rangeLabel = (start: string, end: string) =>
  `${fmt({ day: "numeric", month: "short" }).format(new Date(`${start}T00:00:00Z`))} – ${fmt({ day: "numeric", month: "short" }).format(new Date(`${end}T00:00:00Z`))}`;
/** "YYYY-MM" n months away */
export const shiftYm = (ym: string, n: number) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
};
