"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PayBillButton } from "@/components/bills/PayBill";
import { GoalMoneyButton } from "@/components/goals/GoalMoney";
import { IconButton } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import type { GoalWithProgress } from "@/lib/goals";
import type { Notice, NoticeKind } from "@/lib/notifications";
import type { Bill, Wallet } from "@/lib/types";

const LOOK: Record<NoticeKind, { icon: string; tile: string }> = {
  "bill-late": { icon: "error", tile: "bg-negative-container text-negative" },
  "bill-soon": { icon: "receipt_long", tile: "bg-warning-container text-warning" },
  salary: { icon: "payments", tile: "bg-primary-container text-primary" },
  "budget-over": { icon: "pie_chart", tile: "bg-negative-container text-negative" },
  "budget-warn": { icon: "pie_chart", tile: "bg-warning-container text-warning" },
  "goal-behind": { icon: "flag", tile: "bg-warning-container text-warning" },
  "goal-deposit": { icon: "savings", tile: "bg-primary-container text-primary" },
  "goal-done": { icon: "celebration", tile: "bg-positive-container text-positive" },
};

type Props = { notices: Notice[]; bills: Bill[]; goals: GoalWithProgress[]; wallets: Wallet[] };

function List({ notices, bills, goals, wallets, onNavigate }: Props & { onNavigate: () => void }) {
  if (!notices.length)
    return (
      <div className="flex flex-col items-center gap-1 px-6 py-10 text-center text-on-surface-variant">
        <Icon name="notifications_off" className="text-[36px] opacity-60" />
        <p className="text-[15px] font-semibold text-on-surface">Semua beres</p>
        <p className="text-[13px]">Tidak ada yang perlu ditindak</p>
      </div>
    );
  return (
    <ul className="divide-y divide-outline">
      {notices.map((n) => {
        const bill = n.billId ? bills.find((b) => b.id === n.billId) : undefined;
        const goal = n.kind === "goal-deposit" || n.kind === "goal-behind" ? goals.find((g) => g.id === n.goalId) : undefined;
        return (
          <li key={n.id} className="flex items-center gap-3 px-3 py-2.5">
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${LOOK[n.kind].tile}`}>
              <Icon name={LOOK[n.kind].icon} className="text-[19px]" filled />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{n.title}</p>
              <p className="truncate text-[13px] text-on-surface-variant">{n.body}</p>
            </div>
            {bill ? (
              <PayBillButton bill={bill} wallets={wallets} />
            ) : goal && goal.need > goal.depositedThisPeriod ? (
              <GoalMoneyButton goal={goal} wallets={wallets} mode="setor" />
            ) : (
              <Link href={n.href} onClick={onNavigate} aria-label={`Buka: ${n.title}`} className="flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-dim">
                <Icon name="chevron_right" className="text-[20px]" />
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Bell with a count; glass dropdown on desktop, sheet on mobile. */
export function Notifications(props: Props) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = props.notices.length;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Desktop dropdown closes on outside press / Esc; nested dialogs (Bayar, Setor) live in the top layer, so ignore those.
  useEffect(() => {
    if (!open || mobile) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      if (!ref.current?.contains(t) && !t.closest("dialog")) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("dialog[open]") && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, mobile]);

  return (
    <div ref={ref} className="relative">
      <IconButton aria-label={count ? `Notifikasi, ${count} perlu ditindak` : "Notifikasi"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="notifications" className="text-[20px]" filled={open} />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-negative px-1 text-[11px] font-bold text-white tabular-nums"
            >
              {count > 9 ? "9+" : count}
            </motion.span>
          )}
        </AnimatePresence>
      </IconButton>

      {mobile ? (
        <Dialog open={open} onClose={() => setOpen(false)} title="Notifikasi">
          <div className="-mx-5">
            <List {...props} onNavigate={() => setOpen(false)} />
          </div>
        </Dialog>
      ) : (
        <AnimatePresence>
          {open && (
            <motion.div
              role="dialog"
              aria-label="Notifikasi"
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              style={{ originX: 1, originY: 0 }}
              className="glass glass-thick absolute right-0 z-50 mt-2 max-h-[70vh] w-[380px] overflow-y-auto rounded-[18px] border border-outline shadow-[0_20px_40px_-12px_rgb(0_0_0/0.3)]"
            >
              <p className="px-4 pt-3 pb-1 text-[17px] font-bold">Notifikasi</p>
              <List {...props} onNavigate={() => setOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
