import { dueLabel, dueStatus } from "./bills";
import { formatRupiah } from "./money";
import { addDays } from "./period";
import type { PlanningState } from "./planning";
import { wibDate } from "./reports";

// Notification panel (spec §7): derived from data on every render, no stored state.

export type NoticeKind = "bill-late" | "salary" | "budget-over" | "bill-soon" | "goal-behind" | "budget-warn" | "goal-deposit" | "goal-done";
export type Notice = { id: string; kind: NoticeKind; title: string; body: string; href: string; billId?: string; goalId?: string };

const ORDER: NoticeKind[] = ["bill-late", "salary", "budget-over", "bill-soon", "goal-behind", "budget-warn", "goal-deposit", "goal-done"];
const monthName = (ym: string) => new Intl.DateTimeFormat("id-ID", { month: "long", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));

export function buildNotifications(s: PlanningState, today: string, walletNames: Record<string, string> = {}): Notice[] {
  const out: { n: Notice; sortKey: string }[] = [];
  const push = (n: Notice, sortKey = "") => out.push({ n, sortKey });

  for (const b of s.bills) {
    if (b.archived_at) continue;
    const st = dueStatus(b, today);
    if (st.kind === "later") continue;
    const body = [formatRupiah(b.amount), walletNames[b.wallet_id]].filter(Boolean).join(" · ");
    const title = st.kind === "late" ? `${b.name} terlambat ${st.days} hari` : `${b.name} jatuh tempo ${dueLabel(st).toLowerCase()}`;
    push({ id: `bill-${b.id}`, kind: st.kind === "late" ? "bill-late" : "bill-soon", title, body, href: "/rencana?tab=tagihan", billId: b.id }, b.next_due);
  }

  const ym = today.slice(0, 7);
  if (Number(today.slice(8)) >= s.payday && !s.periods.some((p) => p.month.startsWith(ym)))
    push({ id: `salary-${ym}`, kind: "salary", title: `Gaji ${monthName(ym)} belum dicatat`, body: "Catat gaji untuk memulai periode budget baru", href: "/budget" });

  for (const p of s.current?.usage.pos ?? []) {
    if (p.group.is_savings || (p.level !== "over" && p.level !== "warn")) continue;
    const over = p.level === "over";
    push({
      id: `budget-${p.group.id}`,
      kind: over ? "budget-over" : "budget-warn",
      title: over ? `${p.group.name} lebih dari budget` : `${p.group.name} ${p.pct}% terpakai`,
      body: over ? `Lebih ${formatRupiah(-p.left)}` : `Sisa ${formatRupiah(p.left)}`,
      href: "/budget",
    });
  }

  for (const g of s.goals) {
    if (g.archived_at) continue;
    const short = Math.max(0, g.need - g.depositedThisPeriod);
    if (g.status === "tercapai") {
      if (g.achieved_at && wibDate(g.achieved_at) >= addDays(today, -7))
        push({ id: `goal-done-${g.id}`, kind: "goal-done", title: `${g.name} tercapai`, body: `Terkumpul ${formatRupiah(g.saved)}`, href: "/rencana", goalId: g.id });
    } else if (g.status === "tertinggal") {
      const body = g.due_date && g.due_date < today ? "Due date sudah lewat" : `Setor ${formatRupiah(short)} lagi bulan ini`;
      push({ id: `goal-behind-${g.id}`, kind: "goal-behind", title: `${g.name} tertinggal`, body, href: "/rencana", goalId: g.id });
    } else if (short > 0) {
      push({ id: `goal-deposit-${g.id}`, kind: "goal-deposit", title: `Setor ${g.name}`, body: `${formatRupiah(short)} lagi bulan ini`, href: "/rencana", goalId: g.id });
    }
  }

  return out.sort((a, b) => ORDER.indexOf(a.n.kind) - ORDER.indexOf(b.n.kind) || a.sortKey.localeCompare(b.sortKey)).map((x) => x.n);
}
