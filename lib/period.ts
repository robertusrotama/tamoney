import { monthKey, wibDate } from "./reports";

// Analitik periods. All dates are WIB calendar dates ("YYYY-MM-DD"), ranges inclusive.
export type PeriodKind = "minggu" | "bulan" | "tahun" | "rentang";
export type Period = {
  kind: PeriodKind;
  start: string;
  end: string;
  label: string;
  prev: { start: string; end: string };
  canNext: boolean;
};
type Params = Record<string, string | string[] | undefined>;

const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const valid = (d?: string): d is string => !!d && DATE.test(d) && new Date(`${d}T00:00:00Z`).toISOString().startsWith(d);

const toDate = (d: string) => new Date(`${d}T00:00:00Z`);
const fmt = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (d: string, n: number) => fmt(new Date(toDate(d).getTime() + n * 86_400_000));
const daysBetween = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000);
const monday = (d: string) => addDays(d, -((toDate(d).getUTCDay() + 6) % 7));
const monthStart = (d: string) => `${d.slice(0, 7)}-01`;
const monthEnd = (d: string) => {
  const t = toDate(monthStart(d));
  return fmt(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)));
};
const shiftMonth = (d: string, n: number) => {
  const t = toDate(monthStart(d));
  return fmt(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + n, 1)));
};

const intl = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("id-ID", { ...opts, timeZone: "UTC" });
const dayMon = (d: string) => intl({ day: "numeric", month: "short" }).format(toDate(d));
const rangeLabel = (a: string, b: string) =>
  a.slice(0, 4) === b.slice(0, 4) ? `${dayMon(a)} – ${dayMon(b)} ${b.slice(0, 4)}` : `${dayMon(a)} ${a.slice(0, 4)} – ${dayMon(b)} ${b.slice(0, 4)}`;

function bounds(kind: PeriodKind, anchor: string): [string, string] {
  if (kind === "minggu") return [monday(anchor), addDays(monday(anchor), 6)];
  if (kind === "tahun") return [`${anchor.slice(0, 4)}-01-01`, `${anchor.slice(0, 4)}-12-31`];
  return [monthStart(anchor), monthEnd(anchor)];
}

/** Read the period from the URL (?p=minggu|bulan|tahun&d=… or ?p=rentang&dari=…&sampai=…). Old ?bulan=YYYY-MM still works. */
export function periodFromParams(sp: Params, today: string): Period {
  const legacyMonth = one(sp.bulan);
  const kindRaw = one(sp.p) ?? (legacyMonth ? "bulan" : "bulan");
  const kind: PeriodKind = (["minggu", "bulan", "tahun", "rentang"] as const).includes(kindRaw as PeriodKind) ? (kindRaw as PeriodKind) : "bulan";

  if (kind === "rentang") {
    let a = one(sp.dari);
    let b = one(sp.sampai);
    if (valid(a) && valid(b)) {
      if (a > b) [a, b] = [b, a];
      const len = daysBetween(a, b) + 1;
      return { kind, start: a, end: b, label: rangeLabel(a, b), prev: { start: addDays(a, -len), end: addDays(a, -1) }, canNext: false };
    }
    // incomplete range → last 30 days
    const start = addDays(today, -29);
    return { kind, start, end: today, label: rangeLabel(start, today), prev: { start: addDays(start, -30), end: addDays(start, -1) }, canNext: false };
  }

  const d = one(sp.d);
  const anchor = valid(d) ? d : legacyMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(legacyMonth) ? `${legacyMonth}-01` : today;
  const [start, end] = bounds(kind, anchor);
  const [ps, pe] = bounds(kind, stepAnchor(kind, start, -1));
  const label =
    kind === "minggu" ? rangeLabel(start, end) : kind === "tahun" ? start.slice(0, 4) : intl({ month: "long", year: "numeric" }).format(toDate(start));
  return { kind, start, end, label, prev: { start: ps, end: pe }, canNext: addDays(end, 1) <= today };
}

function stepAnchor(kind: PeriodKind, start: string, step: number) {
  if (kind === "minggu") return addDays(start, 7 * step);
  if (kind === "tahun") return `${Number(start.slice(0, 4)) + step}-01-01`;
  return shiftMonth(start, step);
}

/** URL params for the period `step` periods away (0 = this one). */
export function periodParams(p: Period, step: number): Record<string, string> {
  if (p.kind === "rentang") {
    const len = daysBetween(p.start, p.end) + 1;
    return { p: "rentang", dari: addDays(p.start, len * step), sampai: addDays(p.end, len * step) };
  }
  return { p: p.kind, d: stepAnchor(p.kind, p.start, step) };
}

/** UTC instants for a WIB date range [start, end] inclusive → [startIso, endIso). */
export const isoRange = (start: string, end: string) => ({
  start: new Date(toDate(start).getTime() - 7 * 3_600_000).toISOString(),
  end: new Date(toDate(addDays(end, 1)).getTime() - 7 * 3_600_000).toISOString(),
});

export type Unit = "hari" | "minggu" | "bulan";

/** Bucket a timestamp falls into: WIB date, Monday of its WIB week, or WIB month. */
export const bucketKey = (iso: string, unit: Unit) => {
  const date = wibDate(iso);
  return unit === "hari" ? date : unit === "minggu" ? monday(date) : date.slice(0, 7);
};

/** Bars for a chart: one bucket per day / Monday-week / month across [start, end], zeros included. */
export function series(rows: { amount: number; occurred_at: string }[], start: string, end: string, unit: Unit) {
  const keyOf = (date: string) => (unit === "hari" ? date : unit === "minggu" ? monday(date) : date.slice(0, 7));
  const totals = new Map<string, number>();
  for (const r of rows) {
    const k = unit === "bulan" ? monthKey(r.occurred_at) : keyOf(wibDate(r.occurred_at));
    totals.set(k, (totals.get(k) ?? 0) + r.amount);
  }
  const out: { key: string; label: string; total: number }[] = [];
  let cur = unit === "hari" ? start : unit === "minggu" ? monday(start) : monthStart(start);
  while (cur <= end) {
    const key = keyOf(cur);
    const label = unit === "hari" ? String(Number(cur.slice(8))) : unit === "minggu" ? dayMon(cur) : intl({ month: "short" }).format(toDate(cur));
    out.push({ key, label, total: totals.get(key) ?? 0 });
    cur = unit === "hari" ? addDays(cur, 1) : unit === "minggu" ? addDays(cur, 7) : shiftMonth(cur, 1);
  }
  return out;
}

export type Filter = { q?: string; categories?: string[]; wallets?: string[]; kind?: string };
type FilterableRow = {
  kind: string;
  category_id: string | null;
  category_name?: string | null;
  wallet_id: string;
  to_wallet_id: string | null;
  note: string | null;
};

/** Search + multi-select categories/wallets (any of) + single kind. Empty selections mean "all". */
export function filterRows<T extends FilterableRow>(rows: T[], f: Filter): T[] {
  const q = f.q?.trim().toLowerCase();
  const cats = f.categories?.length ? new Set(f.categories) : null;
  const wallets = f.wallets?.length ? new Set(f.wallets) : null;
  return rows.filter(
    (t) =>
      (!q || `${t.note ?? ""} ${t.category_name ?? ""}`.toLowerCase().includes(q)) &&
      (!cats || (t.category_id !== null && cats.has(t.category_id))) &&
      (!wallets || wallets.has(t.wallet_id) || (t.to_wallet_id !== null && wallets.has(t.to_wallet_id))) &&
      (!f.kind || f.kind === "all" || t.kind === f.kind),
  );
}

// Kibana-style picker (components/analytics/Period.tsx): quick "last N" ranges and commonly used presets.
export type QuickUnit = "hari" | "minggu" | "bulan" | "tahun";

/** Same day n months back, clamped to the month's last day (31 Mar − 1 month = 28/29 Feb). */
const monthsBack = (d: string, n: number) => {
  const [y, m, day] = d.split("-").map(Number);
  const last = new Date(Date.UTC(y, m - 1 - n + 1, 0)).getUTCDate();
  return fmt(new Date(Date.UTC(y, m - 1 - n, Math.min(day, last))));
};

/** "Terakhir N unit" ending today, as range params. */
export function lastN(today: string, n: number, unit: QuickUnit): { p: "rentang"; dari: string; sampai: string } {
  const back = unit === "hari" ? addDays(today, -n) : unit === "minggu" ? addDays(today, -7 * n) : monthsBack(today, unit === "bulan" ? n : 12 * n);
  return { p: "rentang", dari: addDays(back, 1), sampai: today };
}

/** The "Sering dipakai" list. Labels are Indonesian keys (translated by the caller). */
export function commonRanges(today: string): { label: string; params: Record<string, string> }[] {
  return [
    { label: "Hari ini", params: { p: "rentang", dari: today, sampai: today } },
    { label: "Minggu ini", params: { p: "minggu", d: today } },
    { label: "Bulan ini", params: { p: "bulan", d: today } },
    { label: "Tahun ini", params: { p: "tahun", d: today } },
    { label: "7 hari terakhir", params: lastN(today, 7, "hari") },
    { label: "30 hari terakhir", params: lastN(today, 30, "hari") },
    { label: "90 hari terakhir", params: lastN(today, 90, "hari") },
    { label: "1 tahun terakhir", params: lastN(today, 1, "tahun") },
    { label: "Minggu lalu", params: { p: "minggu", d: addDays(monday(today), -7) } },
    { label: "Bulan lalu", params: { p: "bulan", d: shiftMonth(today, -1) } },
    { label: "Tahun lalu", params: { p: "tahun", d: `${Number(today.slice(0, 4)) - 1}-01-01` } },
  ];
}
