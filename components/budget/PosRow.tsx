"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { Picker } from "@/components/ui/Picker";
import type { PosUsage } from "@/lib/budget";

const BAR = { ok: "bg-primary", warn: "bg-warning", over: "bg-negative", saved: "bg-positive" };
const TILE = { ok: "bg-primary-container text-primary", warn: "bg-warning-container text-warning", over: "bg-negative-container text-negative", saved: "bg-positive-container text-positive" };

/** One pos: used / limit with a bar that grows from the left (transform only). */
export function PosRow({ p, note, href }: { p: PosUsage; note?: string; href?: string }) {
  const fill = p.limit > 0 ? Math.min(1, Math.max(0, p.used) / p.limit) : p.used > 0 ? 1 : 0;
  const savings = p.group.is_savings;
  const Row = href ? Link : "div";
  return (
    <Row href={href as string} className={`flex items-center gap-3 px-4 py-3 ${href ? "hover:bg-surface-dim" : ""}`}>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${TILE[p.level]}`}>
        <Icon name={p.group.icon} className="text-[20px]" filled />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-[17px]">{p.group.name}</p>
          <p className={`shrink-0 text-[15px] font-semibold tabular-nums ${p.level === "over" ? "text-negative" : ""}`}>
            {savings ? (
              <Money value={p.used} />
            ) : p.left >= 0 ? (
              <>
                Sisa <Money value={p.left} />
              </>
            ) : (
              <>
                Lebih <Money value={-p.left} />
              </>
            )}
          </p>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-dim">
          <motion.div
            className={`h-full rounded-full ${BAR[p.level]}`}
            style={{ originX: 0 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: fill }}
            transition={{ type: "spring", bounce: 0, duration: 0.7 }}
          />
        </div>
        <p className="mt-1 text-[13px] text-on-surface-variant tabular-nums">
          {savings ? "Terkumpul" : "Terpakai"} <Money value={Math.max(0, p.used)} /> dari <Money value={p.limit} /> · {p.pct}%
          {note && <span className="block">{note}</span>}
        </p>
      </div>
      {href && <Icon name="chevron_right" className="-mr-1 text-[20px] text-on-surface-variant" />}
    </Row>
  );
}

export function PeriodPicker({ value, options }: { value: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  return (
    <div className="w-full sm:w-56">
      <Picker label="Periode" value={value} onChange={(v) => router.push(`/budget?periode=${v}`)} options={options.map((o) => ({ ...o, icon: "calendar_month" }))} />
    </div>
  );
}
