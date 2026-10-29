"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { addDays } from "@/lib/period";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const monthTitle = (ym: string) =>
  new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));
const shift = (ym: string, n: number) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
};

/** Monday-first grid of one month: leading blanks, then each date "YYYY-MM-DD". */
function grid(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`)] as (string | null)[];
}

/** Pick a start, then an end (hover previews the range). Presets for the common spans. Future dates disabled. */
export function RangeCalendar({
  start,
  end,
  today,
  onApply,
}: {
  start: string;
  end: string;
  today: string;
  onApply: (start: string, end: string) => void;
}) {
  const [view, setView] = useState(end.slice(0, 7));
  const [a, setA] = useState<string | null>(start);
  const [b, setB] = useState<string | null>(end);
  const [hover, setHover] = useState<string | null>(null);

  const lo = a && (b ?? hover) ? ([a, b ?? hover!].sort()[0] as string) : a;
  const hi = a && (b ?? hover) ? ([a, b ?? hover!].sort()[1] as string) : a;

  const pick = (d: string) => {
    if (!a || b) {
      setA(d);
      setB(null);
    } else setB(d);
  };

  return (
    <div className="w-[300px] p-1.5">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {[7, 30, 90].map((n) => (
          <motion.button
            key={n}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => onApply(addDays(today, -(n - 1)), today)}
            className="rounded-full bg-surface-dim px-3 py-1 text-[13px] font-medium hover:bg-primary-container hover:text-on-primary-container"
          >
            {n} hari
          </motion.button>
        ))}
      </div>

      <div className="mb-1 flex items-center justify-between">
        <IconButton onClick={() => setView((v) => shift(v, -1))} aria-label="Bulan sebelumnya" className="text-primary">
          <Icon name="chevron_left" />
        </IconButton>
        <span className="text-[15px] font-semibold">{monthTitle(view)}</span>
        <IconButton onClick={() => setView((v) => shift(v, 1))} disabled={view >= today.slice(0, 7)} aria-label="Bulan berikutnya" className="text-primary disabled:opacity-30">
          <Icon name="chevron_right" />
        </IconButton>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-on-surface-variant">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7" onPointerLeave={() => setHover(null)}>
        {grid(view).map((d, i) => {
          if (!d) return <span key={`b${i}`} />;
          const inRange = lo && hi && d >= lo && d <= hi;
          const edge = d === lo || d === hi;
          const future = d > today;
          return (
            <button
              key={d}
              type="button"
              disabled={future}
              onClick={() => pick(d)}
              onPointerEnter={() => a && !b && setHover(d)}
              aria-pressed={!!edge}
              aria-label={d}
              className={`relative h-9 text-[14px] tabular-nums disabled:opacity-25 ${inRange && !edge ? "bg-primary-container text-on-primary-container" : ""} ${
                d === lo ? "rounded-l-full" : ""
              } ${d === hi ? "rounded-r-full" : ""}`}
            >
              {edge && <motion.span layoutId="range-edge" className="absolute inset-0.5 rounded-full bg-primary" />}
              <span className={`relative ${edge ? "font-semibold text-on-primary" : d === today ? "font-semibold text-primary" : ""}`}>{Number(d.slice(8))}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-outline pt-2">
        <span className="text-[13px] text-on-surface-variant">{!a ? "Pilih tanggal awal" : !b ? "Pilih tanggal akhir" : `${(daysBetween(lo!, hi!) + 1).toString()} hari`}</span>
        <Button disabled={!a || !b} onClick={() => onApply(lo!, hi!)} className="min-h-8 px-4 text-[14px]">
          Terapkan
        </Button>
      </div>
    </div>
  );
}

const daysBetween = (x: string, y: string) => Math.round((Date.parse(`${y}T00:00:00Z`) - Date.parse(`${x}T00:00:00Z`)) / 86_400_000);
