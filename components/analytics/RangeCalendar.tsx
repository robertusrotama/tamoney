"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MonthGrid } from "@/components/ui/MonthGrid";
import { addDays } from "@/lib/period";

const daysBetween = (x: string, y: string) => Math.round((Date.parse(`${y}T00:00:00Z`) - Date.parse(`${x}T00:00:00Z`)) / 86_400_000);

/** Pick a start, then an end (hover previews the range). Presets for the common spans. Future dates disabled. */
export function RangeCalendar({ start, end, today, onApply }: { start: string; end: string; today: string; onApply: (start: string, end: string) => void }) {
  const [view, setView] = useState(end.slice(0, 7));
  const [a, setA] = useState<string | null>(start);
  const [b, setB] = useState<string | null>(end);
  const [hover, setHover] = useState<string | null>(null);

  const other = b ?? hover;
  const [lo, hi] = a && other ? [a, other].sort() : [a, a];

  return (
    <div className="w-[300px] p-1.5">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {[7, 30, 90].map((n) => (
          <Button key={n} variant="tonal" size="sm" onClick={() => onApply(addDays(today, -(n - 1)), today)}>
            {n} hari
          </Button>
        ))}
      </div>

      <MonthGrid
        view={view}
        onView={setView}
        today={today}
        layoutId="range-edge"
        edge={(d) => d === lo || d === hi}
        between={(d) => !!lo && !!hi && d > lo && d < hi}
        onHover={(d) => a && !b && setHover(d)}
        onPick={(d) => {
          if (!a || b) {
            setA(d);
            setB(null);
          } else setB(d);
        }}
      />

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-outline pt-2">
        <span className="text-[13px] text-on-surface-variant">
          {!a ? "Pilih tanggal awal" : !b ? "Pilih tanggal akhir" : `${daysBetween(lo!, hi!) + 1} hari`}
        </span>
        <Button size="sm" disabled={!a || !b} onClick={() => onApply(lo!, hi!)}>
          Terapkan
        </Button>
      </div>
    </div>
  );
}
