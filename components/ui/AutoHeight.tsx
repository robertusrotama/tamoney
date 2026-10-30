"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Animates its own height to fit whatever is inside (measured with ResizeObserver), so swapping content
 * grows/shrinks the surrounding card or sheet smoothly. A little inner padding keeps focus rings unclipped.
 */
export function AutoHeight({ children }: { children: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setHeight(entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.div initial={false} animate={{ height }} transition={{ type: "spring", bounce: 0, duration: 0.35 }} className="-m-2 overflow-hidden">
      <div ref={inner} className="relative p-2">
        {children}
      </div>
    </motion.div>
  );
}
