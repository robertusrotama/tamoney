"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/Dialog";

/**
 * Header button + panel shared by the bell and the profile menu: a glass dropdown that grows from the
 * button on desktop, a draggable sheet on mobile. `children` gets `close` (e.g. for links inside).
 */
export function HeaderPanel({
  trigger,
  label,
  title,
  width = 380,
  children,
}: {
  trigger: (open: boolean, toggle: () => void) => ReactNode;
  label: string;
  title?: string;
  width?: number;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Closes on outside press / Esc; nested dialogs (Bayar, Setor) live in the top layer, so ignore those.
  useEffect(() => {
    if (!open || mobile) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      if (!ref.current?.contains(t) && !t.closest("dialog")) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("dialog[open]") && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, mobile]);

  return (
    <div ref={ref} className="relative">
      {trigger(open, () => setOpen((o) => !o))}
      {mobile ? (
        <Dialog open={open} onClose={close} title={title ?? label}>
          <div className="-mx-5">{children(close)}</div>
        </Dialog>
      ) : (
        <AnimatePresence>
          {open && (
            <motion.div
              role="dialog"
              aria-label={label}
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              style={{ originX: 1, originY: 0, width }}
              className="glass glass-thick absolute right-0 z-50 mt-2 max-h-[75vh] overflow-y-auto rounded-[20px] border border-outline shadow-[0_20px_40px_-12px_rgb(0_0_0/0.3)]"
            >
              {title && <p className="px-4 pt-3 pb-1 text-[17px] font-bold">{title}</p>}
              {children(close)}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
