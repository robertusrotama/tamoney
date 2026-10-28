"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatRupiah } from "@/lib/money";

const POSITIVE = "#059669";
const NEGATIVE = "#e11d48";
export const CATEGORY_COLORS = ["#1e3a8a", "#6366f1", "#059669", "#e11d48", "#f59e0b", "#0ea5e9", "#64748b"];

const tooltip = {
  formatter: (v: unknown) => formatRupiah(Number(v)),
  contentStyle: { borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 },
};

export function TrendChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barGap={4}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
        <Tooltip {...tooltip} cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="income" name="Pemasukan" fill={POSITIVE} radius={[6, 6, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expense" name="Pengeluaran" fill={NEGATIVE} radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({ data }: { data: { name: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2} stroke="none">
          {data.map((_, i) => (
            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...tooltip} />
      </PieChart>
    </ResponsiveContainer>
  );
}
