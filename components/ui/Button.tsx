"use client";

import { motion, type HTMLMotionProps } from "motion/react";

const VARIANTS = {
  primary: "bg-primary text-on-primary hover:brightness-110",
  tonal: "bg-primary-container text-on-primary-container hover:brightness-95 dark:hover:brightness-125",
  ghost: "text-primary hover:bg-primary-container",
  outline: "border border-outline bg-transparent text-on-surface hover:bg-surface-dim",
  danger: "bg-negative-container text-negative hover:brightness-95 dark:hover:brightness-125",
  destructive: "bg-negative text-white hover:brightness-110",
};

/** The only button sizes in the app: lg = page/auth CTA, md = forms & dialogs, sm = inline row actions. */
const SIZES = {
  lg: "h-13 px-6 text-[17px] gap-2",
  md: "h-11 px-5 text-[15px] gap-1.5",
  sm: "h-8 px-3.5 text-[13px] gap-1",
};

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

/** Feedback on press-down, not on release (whileTap fires on pointerdown). */
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: HTMLMotionProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97, opacity: 0.85 }}
      transition={{ type: "spring", bounce: 0, duration: 0.2 }}
      {...props}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  );
}

const TONES = {
  muted: "text-on-surface-variant hover:bg-surface-dim",
  primary: "text-primary hover:bg-primary-container",
  inherit: "text-current hover:bg-white/15", // on a colored surface (wallet card)
};

/**
 * Round icon-only button (toolbar style). Always give it an aria-label.
 * Color comes from `tone`, never from className (two text-* classes on one element fight over CSS order).
 */
export function IconButton({ className = "", tone = "muted", ...props }: HTMLMotionProps<"button"> & { tone?: "muted" | "primary" | "inherit" }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", bounce: 0, duration: 0.2 }}
      {...props}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${TONES[tone]} focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30 ${className}`}
    />
  );
}
