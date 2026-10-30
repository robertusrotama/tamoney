import { dueStatus } from "./bills";
import { makeT, type T } from "./i18n";
import { formatRupiah } from "./money";
import { addDays } from "./period";
import type { PlanningState } from "./planning";
import { wibDate } from "./reports";

// Notification panel (spec §7): derived from data on every render, no stored state.

export type NoticeKind = "bill-late" | "salary" | "budget-over" | "owed" | "bill-soon" | "goal-behind" | "budget-warn" | "goal-deposit" | "goal-done";
export type Notice = { id: string; kind: NoticeKind; title: string; body: string; href: string; billId?: string; goalId?: string; owedId?: string };

const ORDER: NoticeKind[] = ["bill-late", "salary", "budget-over", "owed", "bill-soon", "goal-behind", "budget-warn", "goal-deposit", "goal-done"];
const monthName = (ym: string, locale: string) => new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));

export function buildNotifications(s: PlanningState, today: string, walletNames: Record<string, string> = {}, t: T = makeT("id"), locale = "id-ID"): Notice[] {
  const out: { n: Notice; sortKey: string }[] = [];
  const push = (n: Notice, sortKey = "") => out.push({ n, sortKey });

  for (const b of s.bills) {
    if (b.archived_at) continue;
    const st = dueStatus(b, today);
    if (st.kind === "later") continue;
    const body = [formatRupiah(b.amount), walletNames[b.wallet_id]].filter(Boolean).join(" · ");
    const title =
      st.kind === "late"
        ? t("{name} terlambat {n} hari", { name: b.name, n: st.days })
        : st.days === 0
          ? t("{name} jatuh tempo hari ini", { name: b.name })
          : st.days === 1
            ? t("{name} jatuh tempo besok", { name: b.name })
            : t("{name} jatuh tempo dalam {n} hari", { name: b.name, n: st.days });
    push({ id: `bill-${b.id}`, kind: st.kind === "late" ? "bill-late" : "bill-soon", title, body, href: "/rencana?tab=tagihan", billId: b.id }, b.next_due);
  }

  const ym = today.slice(0, 7);
  if (Number(today.slice(8)) >= s.payday && !s.periods.some((p) => p.month.startsWith(ym)))
    push({ id: `salary-${ym}`, kind: "salary", title: t("Gaji {month} belum dicatat", { month: monthName(ym, locale) }), body: t("Catat gaji untuk memulai periode budget baru"), href: "/budget" });

  for (const p of s.current?.usage.pos ?? []) {
    if (p.group.is_savings || (p.level !== "over" && p.level !== "warn")) continue;
    const over = p.level === "over";
    push({
      id: `budget-${p.group.id}`,
      kind: over ? "budget-over" : "budget-warn",
      title: over ? t("{name} lebih dari budget", { name: p.group.name }) : t("{name} {pct}% terpakai", { name: p.group.name, pct: p.pct }),
      body: over ? t("Lebih {x}", { x: formatRupiah(-p.left) }) : t("Sisa {x}", { x: formatRupiah(p.left) }),
      href: "/budget",
    });
  }

  // Paid for friends and not collected yet ("Tagih ke teman"), oldest first.
  for (const o of s.owed) {
    const when = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${wibDate(o.occurred_at)}T00:00:00Z`));
    push(
      {
        id: `owed-${o.id}`,
        kind: "owed",
        title: t("Tagih {who} · {x}", { who: o.owed_note || t("teman"), x: formatRupiah(o.owed_amount) }),
        body: `${o.note || o.category_name || t("Pengeluaran")} · ${when}`,
        href: "/analitik",
        owedId: o.id,
      },
      o.occurred_at,
    );
  }

  for (const g of s.goals) {
    if (g.archived_at) continue;
    const short = Math.max(0, g.need - g.depositedThisPeriod);
    if (g.status === "tercapai") {
      if (g.achieved_at && wibDate(g.achieved_at) >= addDays(today, -7))
        push({ id: `goal-done-${g.id}`, kind: "goal-done", title: t("{name} tercapai", { name: g.name }), body: t("Terkumpul {x}", { x: formatRupiah(g.saved) }), href: "/rencana", goalId: g.id });
    } else if (g.status === "tertinggal") {
      const body = g.due_date && g.due_date < today ? t("Due date sudah lewat") : t("Setor {x} lagi bulan ini", { x: formatRupiah(short) });
      push({ id: `goal-behind-${g.id}`, kind: "goal-behind", title: t("{name} tertinggal", { name: g.name }), body, href: "/rencana", goalId: g.id });
    } else if (short > 0) {
      push({ id: `goal-deposit-${g.id}`, kind: "goal-deposit", title: t("Setor {name}", { name: g.name }), body: t("{x} lagi bulan ini", { x: formatRupiah(short) }), href: "/rencana", goalId: g.id });
    }
  }

  return out.sort((a, b) => ORDER.indexOf(a.n.kind) - ORDER.indexOf(b.n.kind) || a.sortKey.localeCompare(b.sortKey)).map((x) => x.n);
}
