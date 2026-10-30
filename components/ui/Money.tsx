"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { formatRupiah } from "@/lib/money";
import { useBalancesHidden } from "./Privacy";

/**
 * Rupiah with tabular figures. sign="auto": green +/red − by sign.
 * Changes count smoothly from the value on screen to the new one (no jump when a transaction lands).
 */
/** `sensitive` = a balance: masked while the user has balances hidden (eye toggle). */
export function Money({ value, sign = "none", className = "", sensitive }: { value: number; sign?: "auto" | "none"; className?: string; sensitive?: boolean }) {
  const hidden = useBalancesHidden() && sensitive;
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
  if (hidden) return <span className={`tabular-nums ${className}`}>Rp ••••••</span>;
  return <motion.span className={`tabular-nums ${color} ${className}`}>{text}</motion.span>;
}
