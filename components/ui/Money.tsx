"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { formatRupiah } from "@/lib/money";

/**
 * Rupiah with tabular figures. sign="auto": green +/red − by sign.
 * Changes count smoothly from the value on screen to the new one (no jump when a transaction lands).
 */
export function Money({ value, sign = "none", className = "" }: { value: number; sign?: "auto" | "none"; className?: string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => {
    const n = Math.round(v);
    return `${sign === "auto" && n > 0 ? "+" : ""}${formatRupiah(n)}`;
  });

  useEffect(() => {
    const controls = animate(mv, value, { type: "spring", bounce: 0, duration: 0.6 });
    return () => controls.stop();
  }, [mv, value]);

  const color = sign === "auto" ? (value > 0 ? "text-positive" : value < 0 ? "text-negative" : "") : "";
  return <motion.span className={`tabular-nums ${color} ${className}`}>{text}</motion.span>;
}
