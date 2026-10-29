"use client";

import { motion } from "motion/react";
import { IconButton } from "./Button";
import { Icon } from "./Icon";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const title = (ym: string) =>
  new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));
export const shiftYm = (ym: string, n: number) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
};

/** Monday-first cells of one month: leading blanks, then each "YYYY-MM-DD". */
function cells(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`)] as (string | null)[];
}

/**
 * Month calendar shared by DateField (single date) and RangeCalendar (range). Selection drawing is the
 * caller's: `edge(d)` = filled circle (start/end/selected), `between(d)` = tinted band. Future dates off.
 */
export function MonthGrid({
  view,
  onView,
  today,
  edge,
  between = () => false,
  onPick,
  onHover,
  layoutId,
}: {
  view: string;
  onView: (ym: string) => void;
  today: string;
  edge: (d: string) => boolean;
  between?: (d: string) => boolean;
  onPick: (d: string) => void;
  onHover?: (d: string | null) => void;
  layoutId: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <IconButton onClick={() => onView(shiftYm(view, -1))} aria-label="Bulan sebelumnya" tone="primary">
          <Icon name="chevron_left" />
        </IconButton>
        <span className="text-[15px] font-semibold" aria-live="polite">
          {title(view)}
        </span>
        <IconButton onClick={() => onView(shiftYm(view, 1))} disabled={view >= today.slice(0, 7)} aria-label="Bulan berikutnya" tone="primary">
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
      <div className="grid grid-cols-7" onPointerLeave={() => onHover?.(null)}>
        {cells(view).map((d, i) => {
          if (!d) return <span key={`b${i}`} />;
          const isEdge = edge(d);
          const band = between(d) && !isEdge;
          return (
            <button
              key={d}
              type="button"
              disabled={d > today}
              onClick={() => onPick(d)}
              onPointerEnter={() => onHover?.(d)}
              aria-pressed={isEdge}
              aria-label={new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`))}
              className={`relative h-9 rounded-full text-[14px] tabular-nums hover:bg-surface-dim focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:pointer-events-none disabled:opacity-25 ${
                band ? "rounded-none bg-primary-container text-on-primary-container hover:bg-primary-container" : ""
              }`}
            >
              {isEdge && <motion.span layoutId={layoutId} className="absolute inset-0.5 rounded-full bg-primary" />}
              <span className={`relative ${isEdge ? "font-semibold text-on-primary" : d === today ? "font-semibold text-primary" : ""}`}>{Number(d.slice(8))}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
