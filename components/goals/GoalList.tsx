"use client";

import { motion } from "motion/react";
import { useTransition } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Confirm";
import { Card, EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { setGoalArchived } from "@/lib/actions/goals";
import type { GoalStatus, GoalWithProgress } from "@/lib/goals";
import type { Wallet } from "@/lib/types";
import { GoalDialog } from "./GoalForm";
import { GoalMoneyButton } from "./GoalMoney";

const STATUS: Record<GoalStatus, { label: string; className: string }> = {
  sesuai: { label: "Sesuai rencana", className: "bg-positive-container text-positive" },
  tertinggal: { label: "Tertinggal", className: "bg-warning-container text-warning" },
  tercapai: { label: "Tercapai", className: "bg-primary-container text-primary" },
};

const monthsLeft = (today: string, due: string) => {
  const [y1, m1] = today.split("-").map(Number);
  const [y2, m2] = due.split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
};
const monthYear = (d: string) => new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

/** Progress ring; the arc grows with a transform-free pathLength animation. */
export function Ring({ value, size = 64, children }: { value: number; size?: number; children?: React.ReactNode }) {
  const r = (size - 8) / 2;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={7} className="stroke-surface-dim" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={7}
          strokeLinecap="round"
          className={value >= 1 ? "stroke-positive" : "stroke-primary"}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.min(1, Math.max(0, value)) }}
          transition={{ type: "spring", bounce: 0, duration: 0.9 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function GoalCard({ goal, wallets, allWallets, payday, periodMonth, today }: { goal: GoalWithProgress; wallets: Wallet[]; allWallets: Wallet[]; payday: number; periodMonth: string; today: string }) {
  const [confirm, dialog] = useConfirm();
  const [pending, start] = useTransition();
  const wallet = allWallets.find((w) => w.id === goal.wallet_id)?.name;
  const status = STATUS[goal.status];
  const pct = Math.round((goal.saved / goal.target) * 100);

  const archive = async () => {
    if (await confirm({ title: `Arsipkan ${goal.name}?`, message: "Goal tidak lagi ditampilkan. Setoran yang sudah tercatat tetap ada di riwayat transfer.", confirmLabel: "Arsipkan", destructive: true }))
      start(async () => void (await setGoalArchived(goal.id, true)));
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <Ring value={goal.saved / goal.target}>
          <Icon name={goal.icon} className={`text-[24px] ${goal.status === "tercapai" ? "text-positive" : "text-primary"}`} filled />
        </Ring>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[17px] font-semibold">{goal.name}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold ${status.className}`}>{status.label}</span>
          </div>
          <p className="text-[22px] leading-tight font-bold tracking-[-0.01em] tabular-nums">
            <Money value={goal.saved} />
          </p>
          <p className="text-[13px] text-on-surface-variant tabular-nums">
            {pct}% dari <Money value={goal.target} />
          </p>
        </div>
      </div>

      <div className="space-y-1 text-[13px] text-on-surface-variant">
        <p className="flex items-center gap-1.5">
          <Icon name="account_balance_wallet" className="text-[16px]" /> {wallet ?? "Dompet tidak ditemukan"}
        </p>
        {goal.due_date && (
          <p className="flex items-center gap-1.5">
            <Icon name="event" className="text-[16px]" /> {monthYear(goal.due_date)}
            {goal.due_date >= today ? ` · ${Math.max(0, monthsLeft(today, goal.due_date))} bln lagi` : " · lewat"}
          </p>
        )}
        {goal.status !== "tercapai" && goal.need > 0 && (
          <p className="flex items-center gap-1.5">
            <Icon name="calendar_month" className="text-[16px]" /> Bulan ini <Money value={goal.depositedThisPeriod} /> dari <Money value={goal.need} />
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center gap-1.5">
        {goal.status !== "tercapai" && <GoalMoneyButton goal={goal} wallets={wallets} mode="setor" />}
        <GoalMoneyButton goal={goal} wallets={wallets} mode="tarik" />
        <div className="-mr-2 ml-auto flex">
          <GoalDialog goal={goal} wallets={wallets} payday={payday} periodMonth={periodMonth} variant="icon">
            <Icon name="edit" className="text-[18px]" />
          </GoalDialog>
          <IconButton aria-label={`Arsipkan ${goal.name}`} onClick={archive} disabled={pending}>
            <Icon name="archive" className="text-[18px]" />
          </IconButton>
        </div>
      </div>
      {dialog}
    </Card>
  );
}

export function GoalList({ goals, wallets, allWallets, payday, periodMonth, today }: { goals: GoalWithProgress[]; wallets: Wallet[]; allWallets: Wallet[]; payday: number; periodMonth: string; today: string }) {
  const [pending, start] = useTransition();
  const active = goals.filter((g) => !g.archived_at);
  const archived = goals.filter((g) => g.archived_at);
  const total = active.reduce((s, g) => s + g.saved, 0);
  const need = active.reduce((s, g) => s + Math.max(0, g.need - g.depositedThisPeriod), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[13px] font-semibold tracking-[0.04em] text-on-surface-variant uppercase">Total terkumpul</p>
          <Money value={total} className="block text-[34px] leading-tight font-bold tracking-[-0.02em]" />
          <p className="text-[15px] text-on-surface-variant">
            {need > 0 ? (
              <>
                Perlu setor <Money value={need} /> lagi bulan ini
              </>
            ) : (
              `${active.length} goal aktif`
            )}
          </p>
        </div>
        <GoalDialog wallets={wallets} payday={payday} periodMonth={periodMonth}>
          <Icon name="add" className="text-[18px]" /> Buat goal
        </GoalDialog>
      </div>

      {active.length === 0 ? (
        <Card>
          <EmptyState icon="flag" title="Buat goal pertama">
            <p className="max-w-sm text-[15px]">Mis. Dana Darurat 3× pengeluaran bulanan, liburan, atau DP rumah. Tentukan target, tenggat, dan di mana uangnya disimpan.</p>
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((g) => (
            <GoalCard key={g.id} goal={g} wallets={wallets} allWallets={allWallets} payday={payday} periodMonth={periodMonth} today={today} />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1 px-1 text-[15px] font-semibold text-on-surface-variant">
            <Icon name="chevron_right" className="text-[20px] group-open:rotate-90" /> Diarsipkan ({archived.length})
          </summary>
          <div className="mt-2 divide-y divide-outline overflow-hidden rounded-[14px] bg-card">
            {archived.map((g) => (
              <div key={g.id} className="flex items-center gap-3 px-4 py-2.5">
                <Icon name={g.icon} className="text-[20px] text-on-surface-variant" />
                <span className="flex-1 truncate text-[17px]">{g.name}</span>
                <Money value={g.saved} className="text-[15px] text-on-surface-variant" />
                <Button variant="tonal" size="sm" disabled={pending} onClick={() => start(async () => void (await setGoalArchived(g.id, false)))}>
                  Pulihkan
                </Button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
