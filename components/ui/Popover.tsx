"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { fieldClass } from "./Field";
import { Ring, useFocusWithin } from "./FocusRing";
import { Icon } from "./Icon";

/**
 * Pill trigger + glass panel that grows out of it. Closes on outside press or Esc (focus returns to
 * the trigger). `children` may be a render function receiving `close`.
 */
export function Popover({
  label,
  active,
  align = "left",
  width = 288,
  variant = "pill",
  ariaLabel,
  children,
}: {
  label: ReactNode;
  active?: boolean;
  align?: "left" | "right";
  /** panel width in px, or "trigger" to match the trigger (field variant) */
  width?: number | "trigger";
  /** pill = filter chip; field = looks exactly like an Input (forms) */
  variant?: "pill" | "field";
  ariaLabel?: string;
  children: ReactNode | ((close: () => void) => ReactNode);
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = () => setOpen(false);
  const { focused, focusProps } = useFocusWithin();
  const wasOpen = useRef(false);

  // Closing (by pick, Esc or close()) hands focus back to the trigger, like a native menu.
  useEffect(() => {
    if (wasOpen.current && !open && ref.current?.contains(document.activeElement ?? null) !== false) trigger.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <motion.button
        ref={trigger}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        {...(variant === "field" ? focusProps : {})}
        whileTap={{ scale: variant === "field" ? 0.99 : 0.96 }}
        className={
          variant === "field"
            ? `${fieldClass} flex items-center justify-between gap-2 text-left`
            : `flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                active ? "bg-primary-container text-on-primary-container" : "bg-card text-on-surface hover:bg-surface-dim"
              }`
        }
      >
        {variant === "field" && <Ring on={open || focused} />}
        <span className="flex min-w-0 items-center gap-1.5 truncate">{label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="flex">
          <Icon name="expand_more" className="text-[18px] opacity-70" />
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            role="dialog"
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            style={{ width: width === "trigger" ? undefined : width, originX: align === "left" ? 0 : 1, originY: 0 }}
            className={`glass glass-thick absolute top-[calc(100%+8px)] z-50 max-w-[calc(100vw-2rem)] rounded-[18px] p-2 ${
              width === "trigger" ? "right-0 left-0 min-w-56" : align === "left" ? "left-0" : "right-0"
            }`}
          >
            {typeof children === "function" ? children(close) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Rounded checkbox / radio mark with a spring tick. */
export function Mark({ checked, round }: { checked: boolean; round?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-5 shrink-0 items-center justify-center border ${round ? "rounded-full" : "rounded-[6px]"} ${
        checked ? "border-primary bg-primary text-on-primary" : "border-outline bg-card"
      }`}
    >
      <motion.span initial={false} animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }} className="flex">
        <Icon name="check" className="text-[15px] font-bold" />
      </motion.span>
    </span>
  );
}
