"use client";

import { motion } from "motion/react";
import { useT } from "@/components/I18n";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import type { Dir, SortBy } from "@/lib/drilldown";
import { formatRupiah } from "@/lib/money";

/** Sort field + a direction toggle whose arrow flips with a spring. Pure client state: instant. */
export function SortControl({ by, dir, onChange }: { by: SortBy; dir: Dir; onChange: (by: SortBy, dir: Dir) => void }) {
  const t = useT();
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <Segmented
          value={by}
          onChange={(v) => onChange(v, v === "nama" ? "asc" : "desc")} // sensible default direction per field
          options={[
            { value: "tanggal", label: t("Tanggal") },
            { value: "nominal", label: t("Nominal") },
            { value: "nama", label: t("Nama") },
          ]}
        />
      </div>
      <IconButton
        onClick={() => onChange(by, dir === "asc" ? "desc" : "asc")}
        aria-label={dir === "asc" ? t("Urutan naik — ubah ke turun") : t("Urutan turun — ubah ke naik")}
        tone="primary"
        className="bg-surface-dim"
      >
        <motion.span animate={{ rotate: dir === "asc" ? 180 : 0 }} className="flex">
          <Icon name="arrow_downward" className="text-[18px]" />
        </motion.span>
      </IconButton>
    </div>
  );
}

/** Bars per bucket; tapping a bar scrolls to that bucket's group in the list. */
export function DrillChart({ data, color }: { data: { key: string; label: string; total: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.total));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" tick={{ fontSize: 11, fill: "var(--c-label-2)" }} />
        <Tooltip
          cursor={{ fill: "var(--c-fill)", radius: 6 }}
          formatter={(v: unknown) => formatRupiah(Number(v))}
          labelFormatter={(l) => String(l)}
          contentStyle={{
            borderRadius: 12,
            border: "none",
            fontSize: 13,
            background: "var(--c-card)",
            color: "var(--c-label)",
            boxShadow: "0 10px 30px -8px rgb(0 0 0 / 0.3)",
          }}
        />
        <Bar
          dataKey="total"
          name="Total"
          radius={[4, 4, 4, 4]}
          maxBarSize={28}
          animationDuration={400}
          cursor="pointer"
          onClick={(d) =>
            document.getElementById(`g-${(d as { key?: string }).key}`)?.scrollIntoView({
              behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
              block: "start",
            })
          }
        >
          {data.map((d) => (
            <Cell key={d.key} fill={color} fillOpacity={d.total === 0 ? 0.15 : d.total === max ? 1 : 0.65} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
