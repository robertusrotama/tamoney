"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** First-paint entrance for list rows; `index` staggers by 30ms, capped so long lists don't drag. */
export function FadeIn({ index = 0, children, className }: { index?: number; children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4, delay: Math.min(index, 10) * 0.03 }}
    >
      {children}
    </motion.div>
  );
}
