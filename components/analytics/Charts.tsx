"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatRupiah } from "@/lib/money";

// CSS variables so charts follow light/dark like the rest of the UI.
const POSITIVE = "var(--c-positive)";
const NEGATIVE = "var(--c-negative)";
/** Apple system palette: blue, orange, purple, teal, pink, yellow, gray. */
export const CATEGORY_COLORS = ["#0a84ff", "#ff9f0a", "#bf5af2", "#40c8e0", "#ff375f", "#ffd60a", "#8e8e93"];

const tooltip = {
  formatter: (v: unknown) => formatRupiah(Number(v)),
  contentStyle: {
    borderRadius: 12,
    border: "none",
    fontSize: 13,
    background: "var(--c-card)",
    color: "var(--c-label)",
    boxShadow: "0 10px 30px -8px rgb(0 0 0 / 0.3)",
  },
  labelStyle: { color: "var(--c-label-2)" },
};

export function TrendChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={3}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--c-label-2)" }} />
        <Tooltip {...tooltip} cursor={{ fill: "var(--c-fill)", radius: 8 }} />
        <Bar dataKey="income" name="Masuk" fill={POSITIVE} radius={[5, 5, 5, 5]} maxBarSize={18} animationDuration={500} />
        <Bar dataKey="expense" name="Keluar" fill={NEGATIVE} radius={[5, 5, 5, 5]} maxBarSize={18} animationDuration={500} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({ data }: { data: { name: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={1.5} cornerRadius={4} stroke="none" animationDuration={600}>
          {data.map((_, i) => (
            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...tooltip} />
      </PieChart>
    </ResponsiveContainer>
  );
}
