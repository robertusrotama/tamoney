"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { shiftMonth } from "@/lib/reports";

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2000, i, 1))),
);
const label = (m: string) =>
  new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));

/**
 * ‹ Oktober 2026 › with a month-grid popover. Replaces <input type="month">, which Safari and
 * Firefox desktop don't implement. Keeps the other filters in the URL, resets the page number.
 */
export function MonthPicker({ month, current }: { month: string; current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(month.slice(0, 4)));
  const ref = useRef<HTMLDivElement>(null);

  const go = (m: string) => {
    const next = new URLSearchParams(params);
    next.set("bulan", m);
    next.delete("hal");
    router.push(`${pathname}?${next}`, { scroll: false });
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const atLatest = month >= current;
  const btn = "flex size-9 items-center justify-center rounded-full text-primary hover:bg-surface-dim disabled:opacity-30";

  return (
    <div ref={ref} className="relative">
      <div className="glass flex items-center rounded-full p-1">
        <motion.button type="button" whileTap={{ scale: 0.88 }} onClick={() => go(shiftMonth(month, -1))} aria-label="Bulan sebelumnya" className={btn}>
          <Icon name="chevron_left" />
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            setYear(Number(month.slice(0, 4)));
            setOpen((o) => !o);
          }}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex min-w-36 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[15px] font-semibold hover:bg-surface-dim"
        >
          <Icon name="calendar_month" className="text-[18px] text-primary" />
          {label(month)}
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={() => go(shiftMonth(month, 1))}
          disabled={atLatest}
          aria-label="Bulan berikutnya"
          className={btn}
        >
          <Icon name="chevron_right" />
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Pilih bulan"
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -6 }}
            style={{ originX: 1, originY: 0 }} // grows out of the trigger's corner
            className="glass glass-thick absolute top-[calc(100%+8px)] right-0 z-50 w-72 rounded-[22px] p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={() => setYear((y) => y - 1)} aria-label="Tahun sebelumnya" className={btn}>
                <Icon name="chevron_left" />
              </button>
              <span className="text-[17px] font-semibold tabular-nums">{year}</span>
              <button
                type="button"
                onClick={() => setYear((y) => y + 1)}
                disabled={year >= Number(current.slice(0, 4))}
                aria-label="Tahun berikutnya"
                className={btn}
              >
                <Icon name="chevron_right" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((name, i) => {
                const m = `${year}-${String(i + 1).padStart(2, "0")}`;
                const selected = m === month;
                return (
                  <motion.button
                    key={m}
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => go(m)}
                    disabled={m > current}
                    aria-pressed={selected}
                    className={`rounded-full py-2 text-[15px] font-medium disabled:opacity-30 ${
                      selected ? "bg-primary text-on-primary" : m === current ? "text-primary hover:bg-surface-dim" : "hover:bg-surface-dim"
                    }`}
                  >
                    {name}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
