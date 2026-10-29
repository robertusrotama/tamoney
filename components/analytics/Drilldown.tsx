"use client";

import { motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { formatRupiah } from "@/lib/money";

/** Writes one search param and keeps the rest (filters, month); the server page re-renders from the URL. */
function useSetParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (entries: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(entries)) next.set(k, v);
    router.replace(`${pathname}?${next}`, { scroll: false });
  };
}

export function UrlSegmented<T extends string>({ param, value, options }: { param: string; value: T; options: { value: T; label: string }[] }) {
  const set = useSetParam();
  return <Segmented value={value} onChange={(v) => set({ [param]: v })} options={options} />;
}

/** Sort field + a direction toggle whose arrow flips with a spring. */
export function SortControl({ by, dir }: { by: "tanggal" | "nominal" | "nama"; dir: "asc" | "desc" }) {
  const set = useSetParam();
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Segmented
          value={by}
          onChange={(v) => set({ urut: v, arah: v === "nama" ? "asc" : "desc" })} // sensible default direction per field
          options={[
            { value: "tanggal", label: "Tanggal" },
            { value: "nominal", label: "Nominal" },
            { value: "nama", label: "Nama" },
          ]}
        />
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={() => set({ arah: dir === "asc" ? "desc" : "asc" })}
        aria-label={dir === "asc" ? "Urutan naik — ubah ke turun" : "Urutan turun — ubah ke naik"}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-dim text-primary"
      >
        <motion.span animate={{ rotate: dir === "asc" ? 180 : 0 }} className="flex">
          <Icon name="arrow_downward" className="text-[18px]" />
        </motion.span>
      </motion.button>
    </div>
  );
}

/** Daily or weekly bars; tapping a bar scrolls to that day's / week's group in the list. */
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
          contentStyle={{ borderRadius: 12, border: "none", fontSize: 13, background: "var(--c-card)", color: "var(--c-label)", boxShadow: "0 10px 30px -8px rgb(0 0 0 / 0.3)" }}
        />
        <Bar
          dataKey="total"
          name="Total"
          radius={[4, 4, 4, 4]}
          maxBarSize={28}
          animationDuration={500}
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
