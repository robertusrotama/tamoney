"use client";

import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SPRING, SPRING_MOMENTUM } from "./MotionProvider";
import { IconButton } from "./Button";
import { useT } from "@/components/I18n";
import { Icon } from "./Icon";

const MOBILE = "(max-width: 767px)";

// Apple's momentum projection (Designing Fluid Interfaces): where a flick would come to rest.
const project = (velocity: number, rate = 0.998) => ((velocity / 1000) * rate) / (1 - rate);

/** Where the trigger was on screen, so the dialog grows out of it and returns to it. */
export type Origin = { x: number; y: number } | null;
export const originOf = (el: Element): Origin => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/**
 * Native <dialog> (focus trap, Esc, top layer) with a Motion surface inside.
 * Mobile: bottom sheet that tracks the finger 1:1 and dismisses on a projected flick.
 * Desktop: centered panel that emerges from (and returns to) its trigger.
 */
export function Dialog({
  open,
  onClose,
  title,
  origin = null,
  glass = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  origin?: Origin;
  /** Frosted glass panel instead of the solid card (wallet card modal). */
  glass?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mobile, setMobile] = useState(false);
  const reduce = useReducedMotion();
  const drag = useDragControls();

  useEffect(() => {
    const mq = window.matchMedia(MOBILE);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
  }, [open]);

  const fromTrigger = () => {
    if (!origin || reduce) return { opacity: 0, scale: 0.96 };
    return { opacity: 0, scale: 0.4, x: origin.x - window.innerWidth / 2, y: origin.y - window.innerHeight / 2 };
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const sheet = ref.current?.querySelector<HTMLElement>("[data-sheet]");
    const height = sheet?.offsetHeight ?? 400;
    if (info.offset.y + project(info.velocity.y) > height / 2) onClose();
  };

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault(); // let the exit animation run before the dialog leaves the top layer
        onClose();
      }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 text-on-surface backdrop:bg-transparent"
    >
      <AnimatePresence onExitComplete={() => ref.current?.close()}>
        {open && (
          <div key="layer" className="fixed inset-0 flex items-end justify-center md:items-center md:p-6">
            <motion.div
              className="absolute inset-0 bg-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            {mobile ? (
              <motion.div
                data-sheet
                role="document"
                className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[14px] text-left shadow-2xl ${glass ? "glass glass-thick" : "bg-card"}`}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%", transition: SPRING_MOMENTUM }}
                transition={SPRING}
                // Dragged only from the grab area: a sheet-wide drag would swallow every vertical swipe, so a
                // long form (e.g. a goal) couldn't scroll and looked frozen on iPhone.
                drag="y"
                dragListener={false}
                dragControls={drag}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.05, bottom: 1 }} // 1:1 down, rubber-band up
                onDragEnd={onDragEnd}
              >
                <div className="shrink-0 touch-none" onPointerDown={(e) => drag.start(e)}>
                  <div className="flex justify-center pt-2 pb-1">
                    <span className="h-1.5 w-9 rounded-full bg-on-surface-variant/40" />
                  </div>
                  <Header title={title} onClose={onClose} />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">{children}</div>
              </motion.div>
            ) : (
              <motion.div
                role="document"
                className={`relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[24px] text-left shadow-[0_25px_60px_-12px_rgb(0_0_0/0.35)] ${glass ? "glass glass-thick" : "bg-card"}`}
                initial={fromTrigger()}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={fromTrigger()}
              >
                <Header title={title} onClose={onClose} />
                <div className="px-6 pb-6">{children}</div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </dialog>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-3 md:px-6 md:pt-5">
      <h2 className="text-[20px] font-bold tracking-[-0.01em]">{title}</h2>
      <IconButton onClick={onClose} aria-label={t("Tutup")} className="bg-surface-dim">
        <Icon name="close" className="text-[18px]" />
      </IconButton>
    </div>
  );
}

/** Open/close state plus the trigger's position, for <Dialog origin>. */
export function useDialog() {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState<Origin>(null);
  return {
    open,
    origin,
    show: (e?: { currentTarget: Element }) => {
      setOrigin(e ? originOf(e.currentTarget) : null);
      setOpen(true);
    },
    close: () => setOpen(false),
  };
}
