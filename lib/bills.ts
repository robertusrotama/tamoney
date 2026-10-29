import { addDays } from "./period";
import type { Bill } from "./types";

// Recurring bills (spec §5). Dates are WIB "YYYY-MM-DD".

const days = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000);

/**
 * Due date after `next_due`. Monthly/yearly keep the original day (due_day), clamped to short months,
 * so the 31st comes back after February. SQL twin: public.bill_next_due() — keep both identical.
 */
export function nextDue(b: Pick<Bill, "cadence" | "due_day" | "next_due">): string {
  if (b.cadence === "weekly") return addDays(b.next_due, 7);
  const [y, m, d] = b.next_due.split("-").map(Number);
  const months = b.cadence === "yearly" ? 12 : 1;
  const last = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + months, Math.min(b.due_day ?? d, last))).toISOString().slice(0, 10);
}

export type DueState = { kind: "late" | "soon" | "later"; days: number };

/** late: past due; soon: inside the reminder window (or today); later: not yet. days = distance from today. */
export function dueStatus(b: Pick<Bill, "next_due" | "remind_days">, today: string): DueState {
  const d = days(today, b.next_due);
  if (d < 0) return { kind: "late", days: -d };
  return { kind: d <= b.remind_days ? "soon" : "later", days: d };
}

export function dueLabel(s: DueState): string {
  if (s.kind === "late") return `Terlambat ${s.days} hari`;
  if (s.days === 0) return "Hari ini";
  if (s.days === 1) return "Besok";
  return `Dalam ${s.days} hari`;
}

/** What active bills cost in `month` ("YYYY-MM"), counting every occurrence from next_due on. */
export function monthTotal(bills: Bill[], month: string): number {
  let total = 0;
  for (const b of bills) {
    if (b.archived_at) continue;
    let due = b.next_due;
    for (let i = 0; i < 400 && due.slice(0, 7) <= month; i++) {
      if (due.startsWith(month)) total += b.amount;
      due = nextDue({ ...b, next_due: due });
    }
  }
  return total;
}
