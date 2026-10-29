"use client";

import { motion, type HTMLMotionProps } from "motion/react";

const VARIANTS = {
  primary: "bg-primary text-on-primary",
  tonal: "bg-primary-container text-on-primary-container",
  ghost: "text-primary",
  danger: "bg-negative-container text-negative",
};

/** Feedback on press-down, not on release (whileTap fires on pointerdown). */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: HTMLMotionProps<"button"> & { variant?: keyof typeof VARIANTS }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97, opacity: 0.85 }}
      transition={{ type: "spring", bounce: 0, duration: 0.2 }}
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-5 text-[15px] font-semibold disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    />
  );
}

/** Small round icon button (toolbar style). */
export function IconButton({ className = "", ...props }: HTMLMotionProps<"button">) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", bounce: 0, duration: 0.2 }}
      {...props}
      className={`inline-flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-dim ${className}`}
    />
  );
}
