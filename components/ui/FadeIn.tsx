"use client";

import { motion } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};

/**
 * Entrance for list rows; `index` staggers by 30ms, capped so long lists don't drag.
 * Never hides server-rendered HTML: hydration reads the server snapshot (false), so on first load content
 * is visible as soon as it arrives instead of sitting at opacity 0 until JS runs. Components mounted later
 * (client navigations) read the client snapshot (true) and fade in.
 */
export function FadeIn({ index = 0, children, className }: { index?: number; children: ReactNode; className?: string }) {
  const animate = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return (
    <motion.div
      className={className}
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4, delay: Math.min(index, 10) * 0.03 }}
    >
      {children}
    </motion.div>
  );
}
