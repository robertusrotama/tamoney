"use client";

import { useRouter } from "next/navigation";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatRupiah } from "@/lib/money";

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

/** links[i] opens slice i's category deep dive. */
export function CategoryDonut({ data, links }: { data: { name: string; amount: number }[]; links?: string[] }) {
  const router = useRouter();
  return (
    <ResponsiveContainer width="100%" height={190}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="name"
          innerRadius={58}
          outerRadius={86}
          paddingAngle={1.5}
          cornerRadius={4}
          stroke="none"
          animationDuration={600}
          cursor={links ? "pointer" : undefined}
          onClick={(_, i) => links?.[i] && router.push(links[i])}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...tooltip} />
      </PieChart>
    </ResponsiveContainer>
  );
}
