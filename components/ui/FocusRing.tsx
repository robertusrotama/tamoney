"use client";

import { motion } from "motion/react";
import { useState, type FocusEvent } from "react";

/** Focus-within state for a field wrapper: stays on while focus moves between its own children. */
export function useFocusWithin() {
  const [focused, setFocused] = useState(false);
  return {
    focused,
    focusProps: {
      onFocus: () => setFocused(true),
      onBlur: (e: FocusEvent<HTMLElement>) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setFocused(false),
    },
  };
}

/** The blue focus outline, faded and settled in with Motion. Parent must be `relative` and rounded. */
export function Ring({ on }: { on: boolean }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[0_0_0_2px_var(--c-primary),0_0_0_6px_var(--c-primary-container)]"
      initial={false}
      animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.985 }}
      transition={{ type: "spring", bounce: 0, duration: 0.25 }}
    />
  );
}
