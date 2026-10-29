import Link from "next/link";
import type { ReactNode } from "react";
import { PayBillButton } from "@/components/bills/PayBill";
import { Ring } from "@/components/goals/GoalList";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { dueLabel, dueStatus } from "@/lib/bills";
import { nominalEnd, safePerDay } from "@/lib/budget";
import { getT } from "@/lib/i18n-server";
import type { PlanningState } from "@/lib/planning";
import type { Wallet } from "@/lib/types";

function PlanCard({ title, href, icon, children }: { title: string; href: string; icon: string; children: ReactNode }) {
  return (
    <section className="flex flex-col rounded-[14px] bg-card p-4">
      <Link href={href} className="mb-3 flex items-center gap-1.5 text-[15px] font-semibold">
        <Icon name={icon} className="text-[18px] text-primary" filled />
        <span className="flex-1">{title}</span>
        <Icon name="chevron_right" className="text-[18px] text-on-surface-variant" />
      </Link>
      {children}
    </section>
  );
}

const Empty = ({ href, cta, children }: { href: string; cta: string; children: ReactNode }) => (
  <Link href={href} className="mt-auto rounded-[10px] bg-surface-dim/60 px-3 py-2.5 text-[13px] text-on-surface-variant hover:bg-surface-dim">
    {children} <span className="font-semibold text-primary">{cta} →</span>
  </Link>
);

/** Ringkasan: this period's budget, the next bills, goal progress. */
export async function PlanCards({ s, wallets }: { s: PlanningState; wallets: Wallet[] }) {
  const t = await getT();
  const cur = s.current;
  const spendable = cur ? cur.usage.pos.filter((p) => !p.group.is_savings).reduce((a, p) => a + p.limit, 0) : 0;
  const left = cur ? spendable - cur.usage.spent : 0;
  const end = cur ? (cur.range.end ?? nominalEnd(cur.range.start, s.payday)) : "";
  const bills = s.bills.filter((b) => !b.archived_at).slice(0, 3);
  const goals = s.goals.filter((g) => !g.archived_at).slice(0, 2);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
      <PlanCard title={t("Budget periode ini")} href="/budget" icon="pie_chart">
        {cur ? (
          <>
            <Money value={left} className={`text-[24px] leading-tight font-bold tracking-[-0.02em] ${left < 0 ? "text-negative" : ""}`} />
            <p className="text-[13px] text-on-surface-variant">
              {t("sisa · aman")} <Money value={safePerDay(cur.usage.pos, s.today, end)} />{t("/hari")}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-dim">
              <div
                className={`h-full rounded-full ${left < 0 ? "bg-negative" : cur.usage.spent / spendable >= 0.8 ? "bg-warning" : "bg-primary"}`}
                style={{ width: `${Math.min(100, spendable ? (cur.usage.spent / spendable) * 100 : 0)}%` }}
              />
            </div>
          </>
        ) : (
          <Empty href="/budget" cta={t("Mulai")}>{t("Catat gaji untuk membagi budget otomatis.")}</Empty>
        )}
      </PlanCard>

      <PlanCard title={t("Tagihan berikutnya")} href="/rencana?tab=tagihan" icon="receipt_long">
        {bills.length ? (
          <ul className="space-y-2">
            {bills.map((b) => {
              const st = dueStatus(b, s.today);
              return (
                <li key={b.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px]">{b.name}</p>
                    <p className={`text-[12px] ${st.kind === "late" ? "text-negative" : st.kind === "soon" ? "text-warning" : "text-on-surface-variant"}`}>
                      {st.kind === "later" ? b.next_due.slice(8) + "/" + b.next_due.slice(5, 7) : dueLabel(st, t)} · <Money value={b.amount} />
                    </p>
                  </div>
                  <PayBillButton bill={b} wallets={wallets} />
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty href="/rencana?tab=tagihan" cta={t("Mulai")}>{t("Catat Netflix, kost, wifi, atau listrik.")}</Empty>
        )}
      </PlanCard>

      <PlanCard title={t("Goals")} href="/rencana" icon="flag">
        {goals.length ? (
          <ul className="space-y-3">
            {goals.map((g) => (
              <li key={g.id} className="flex items-center gap-3">
                <Ring value={g.saved / g.target} size={44}>
                  <Icon name={g.icon} className="text-[18px] text-primary" filled />
                </Ring>
                <div className="min-w-0">
                  <p className="truncate text-[15px]">{g.name}</p>
                  <p className="text-[12px] text-on-surface-variant">
                    <Money value={g.saved} /> · {Math.round((g.saved / g.target) * 100)}%
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty href="/rencana" cta={t("Mulai")}>{t("Buat goal seperti dana darurat atau liburan.")}</Empty>
        )}
      </PlanCard>
    </div>
  );
}
