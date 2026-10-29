"use client";

import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Popover } from "@/components/ui/Popover";
import { Segmented } from "@/components/ui/Segmented";
import { periodParams, type Period, type PeriodKind } from "@/lib/period";
import { RangeCalendar } from "./RangeCalendar";

const PERIOD_KEYS = ["p", "d", "dari", "sampai", "bulan"];

/**
 * Period changes are the only thing that needs the server (new date range → new rows). They run in a
 * transition so the UI answers at once (tab moves, skeleton shows) instead of freezing until data lands.
 */
const Ctx = createContext<{ pending: boolean; go: (params: Record<string, string>) => void }>({ pending: false, go: () => {} });
export const usePeriodPending = () => useContext(Ctx).pending;

export function PeriodProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const go = (params: Record<string, string>) => {
    // keep the client-side filters (they live in the URL too), replace only the period
    const next = new URLSearchParams(window.location.search);
    PERIOD_KEYS.forEach((k) => next.delete(k));
    for (const [k, v] of Object.entries(params)) next.set(k, v);
    start(() => router.push(`${pathname}?${next}`, { scroll: false }));
  };
  return <Ctx.Provider value={{ pending, go }}>{children}</Ctx.Provider>;
}

const KINDS: { value: PeriodKind; label: string }[] = [
  { value: "minggu", label: "Mingguan" },
  { value: "bulan", label: "Bulanan" },
  { value: "tahun", label: "Tahunan" },
  { value: "rentang", label: "Rentang" },
];

/** Mingguan · Bulanan · Tahunan · Rentang, plus ‹ label › (or a range calendar for Rentang). */
export function PeriodBar({ period, today }: { period: Period; today: string }) {
  const { go, pending } = useContext(Ctx);
  const [kind, setKind] = useState(period.kind); // optimistic: the tab moves before the server answers
  const [seen, setSeen] = useState(period.kind);
  if (period.kind !== seen) {
    setSeen(period.kind);
    setKind(period.kind);
  }

  const switchKind = (k: PeriodKind) => {
    setKind(k);
    // land on the period that contains today, or keep the current span for a custom range
    if (k === "rentang") go({ p: "rentang", dari: period.start, sampai: period.end });
    else go({ p: k, d: period.start <= today && today <= period.end ? today : period.start });
  };

  const nav = "flex size-9 items-center justify-center rounded-full text-primary hover:bg-surface-dim disabled:opacity-30";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="w-full sm:w-[400px]">
        <Segmented value={kind} onChange={switchKind} options={KINDS} />
      </div>
      <div className="glass flex items-center rounded-full p-1">
        {period.kind !== "rentang" && (
          <motion.button type="button" whileTap={{ scale: 0.88 }} onClick={() => go(periodParams(period, -1))} aria-label="Periode sebelumnya" className={nav}>
            <Icon name="chevron_left" />
          </motion.button>
        )}
        {period.kind === "rentang" ? (
          <Popover align="right" width={316} label={<><Icon name="date_range" className="text-[18px] text-primary" />{period.label}</>}>
            {(close) => (
              <RangeCalendar
                start={period.start}
                end={period.end}
                today={today}
                onApply={(s, e) => {
                  close();
                  go({ p: "rentang", dari: s, sampai: e });
                }}
              />
            )}
          </Popover>
        ) : (
          <span className="flex min-w-40 items-center justify-center gap-1.5 px-2 text-[15px] font-semibold tabular-nums" aria-live="polite">
            {pending && (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }} className="flex">
                <Icon name="progress_activity" className="text-[16px] text-primary" />
              </motion.span>
            )}
            {period.label}
          </span>
        )}
        {period.kind !== "rentang" && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={() => go(periodParams(period, 1))}
            disabled={!period.canNext}
            aria-label="Periode berikutnya"
            className={nav}
          >
            <Icon name="chevron_right" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
