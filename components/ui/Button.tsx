import type { ComponentProps } from "react";

const VARIANTS = {
  primary: "bg-primary text-on-primary hover:bg-primary/90",
  tonal: "bg-primary-container text-on-primary-container hover:bg-primary-container/70",
  ghost: "text-on-surface-variant hover:bg-surface-dim",
  danger: "bg-negative-container text-on-negative-container hover:bg-negative-container/70",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof VARIANTS }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    />
  );
}
