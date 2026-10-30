"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Mark } from "./Popover";

/** Our checkbox (no native control): a row you tap, with the shared check mark. */
export function Check({ checked, onChange, children, hint }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; hint?: ReactNode }) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.98 }}
      className="flex w-full items-start gap-3 rounded-[14px] bg-surface-dim/60 px-3.5 py-3 text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      <span className="pt-0.5">
        <Mark checked={checked} />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium">{children}</span>
        {hint && <span className="block text-[13px] text-on-surface-variant">{hint}</span>}
      </span>
    </motion.button>
  );
}
