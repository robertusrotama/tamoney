"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
  const panel = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = () => setOpen(false);
  const { focused, focusProps } = useFocusWithin();
  const wasOpen = useRef(false);

  // Closing (by pick, Esc or close()) hands focus back to the trigger, like a native menu.
  useEffect(() => {
    const inside = ref.current?.contains(document.activeElement) || panel.current?.contains(document.activeElement);
    if (wasOpen.current && !open && (inside || document.activeElement === document.body)) trigger.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && !panel.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Float the panel next to the trigger (fixed, so a dialog's scroll box never clips it or grows a scrollbar);
  // open upward when there is more room above. Re-placed on scroll/resize while open.
  useLayoutEffect(() => {
    if (!open || !trigger.current) return;
    const measure = () => setPlace(placeFor(trigger.current!, width, align));
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, width, align]);

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
      {place &&
        createPortal(
          <AnimatePresence onExitComplete={() => setPlace(null)}>
            {open && (
              <motion.div
                ref={panel}
                id={id}
                role="dialog"
                initial={{ opacity: 0, scale: 0.92, y: place.up ? 4 : -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: place.up ? 4 : -4 }}
                style={{
                  position: "fixed",
                  left: place.left,
                  width: place.width,
                  maxHeight: place.maxHeight,
                  ...(place.up ? { bottom: place.edge } : { top: place.edge }),
                  originX: align === "left" ? 0 : 1,
                  originY: place.up ? 1 : 0,
                }}
                className="z-[60] overflow-y-auto overscroll-contain rounded-[18px] border border-outline bg-card p-2 shadow-[0_20px_44px_-12px_rgb(0_0_0/0.35)]"
              >
                {typeof children === "function" ? children(close) : children}
              </motion.div>
            )}
          </AnimatePresence>,
          place.host,
        )}
    </div>
  );
}

type Place = { left: number; width: number; edge: number; up: boolean; maxHeight: number; host: Element };
const GAP = 8;

/** Where a panel fits next to `el`: below unless above has clearly more room; clamped inside the viewport. */
function placeFor(el: HTMLElement, width: number | "trigger", align: "left" | "right"): Place {
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(width === "trigger" ? Math.max(r.width, 224) : width, vw - 2 * GAP);
  const left = Math.min(Math.max(GAP, align === "left" ? r.left : r.right - w), vw - w - GAP);
  const below = vh - r.bottom - 2 * GAP;
  const above = r.top - 2 * GAP;
  const up = below < 280 && above > below;
  // Inside a modal <dialog> the panel must live in it (top layer); elsewhere on <body>.
  const host = el.closest("dialog") ?? document.body;
  return { left, width: w, up, edge: up ? vh - r.top + GAP : r.bottom + GAP, maxHeight: Math.min(440, up ? above : below), host };
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
