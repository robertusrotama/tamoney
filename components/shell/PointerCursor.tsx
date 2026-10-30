"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// iPadOS-style pointer (desktop/mouse only). The dot morphs into the shape of whatever clickable it's over,
// leans a little toward the pointer inside it, and becomes a text bar over fields. Detection is automatic.

const CLICKABLE =
  'a[href], button:not(:disabled), [role="button"], [role="tab"], [role="radio"], [role="checkbox"], [role="option"], [role="switch"], summary, label:has(input[type="checkbox"]), [data-cursor="block"]';
const TEXT = 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([readonly]), textarea, [contenteditable="true"]';
const DOT = 20;
const TOO_BIG = { w: 380, h: 140 }; // bigger targets (wallet cards, whole rows) keep the dot instead of lighting up

type Mode = "dot" | "block" | "text";

/** Pointer device that can hover, and the user hasn't asked for less motion. */
function useFinePointer() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)");
    const sync = () => setOk(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return ok;
}

export function PointerCursor() {
  const active = useFinePointer();
  const [mode, setMode] = useState<Mode>("dot");
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  // An open <dialog> sits in the top layer above every z-index, so the cursor must live inside it then.
  const [host, setHost] = useState<Element | null>(null);

  // Position: very stiff, so the dot sits on the mouse; shape: a quick spring that still morphs visibly.
  const shape = { type: "spring", stiffness: 650, damping: 38, mass: 0.35 } as const;
  const follow = { stiffness: 1400, damping: 34, mass: 0.2 }; // ≈ critically damped: settles in ~40ms, no overshoot
  const x = useSpring(useMotionValue(0), follow);
  const y = useSpring(useMotionValue(0), follow);
  const w = useSpring(DOT, shape);
  const h = useSpring(DOT, shape);
  const r = useSpring(DOT / 2, shape);
  const last = useRef({ x: 0, y: 0 });
  const modeRef = useRef<Mode>("dot");

  // Hide the native pointer only while ours is running.
  useEffect(() => {
    document.documentElement.classList.toggle("ipad-cursor", active);
    return () => document.documentElement.classList.remove("ipad-cursor");
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let frame = 0;

    const place = () => {
      frame = 0;
      const dialogs = document.querySelectorAll("dialog[open]");
      setHost(dialogs.length ? dialogs[dialogs.length - 1] : document.body);
      const { x: px, y: py } = last.current;
      const hit = document.elementFromPoint(px, py);
      const field = hit?.closest(TEXT) as HTMLElement | null;
      const target = field ? null : (hit?.closest(CLICKABLE) as HTMLElement | null);

      if (field) {
        const lh = parseFloat(getComputedStyle(field).fontSize) * 1.25 || 20;
        setMode("text");
        modeRef.current = "text";
        x.set(px);
        y.set(py);
        w.set(3);
        h.set(lh);
        r.set(1.5);
        return;
      }

      const box = target?.getBoundingClientRect();
      if (target && box && box.width <= TOO_BIG.w && box.height <= TOO_BIG.h) {
        const pad = Math.max(6, Math.min(box.width, box.height) * 0.12);
        const radius = parseFloat(getComputedStyle(target).borderTopLeftRadius) || 12;
        // Lean toward the pointer, at most 10% of the element (iPadOS "magnetic" feel).
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        const lean = (d: number, size: number) => Math.max(-size * 0.1, Math.min(size * 0.1, d * 0.2));
        setMode("block");
        modeRef.current = "block";
        x.set(cx + lean(px - cx, box.width));
        y.set(cy + lean(py - cy, box.height));
        w.set(box.width + pad);
        h.set(box.height + pad);
        r.set(Math.min(radius + pad / 2, (box.height + pad) / 2));
        return;
      }

      setMode("dot");
      modeRef.current = "dot";
      x.set(px);
      y.set(py);
      w.set(DOT);
      h.set(DOT);
      r.set(DOT / 2);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      last.current = { x: e.clientX, y: e.clientY };
      setVisible(true);
      // Dot and text bar follow the mouse right away; which shape to take is decided on the next frame.
      if (modeRef.current !== "block") {
        x.set(e.clientX);
        y.set(e.clientY);
      }
      schedule();
    };
    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("blur", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", schedule, { capture: true });
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("blur", onLeave);
    };
  }, [active, x, y, w, h, r]);

  if (!active || !host) return null;
  return createPortal(
    <motion.div
      aria-hidden
      className={`pointer-events-none fixed top-0 left-0 z-[2147483647] ${mode === "block" ? "bg-[var(--c-cursor-block)]" : "bg-[var(--c-cursor)]"}`}
      style={{ x, y, width: w, height: h, borderRadius: r, translateX: "-50%", translateY: "-50%" }}
      animate={{ opacity: visible ? 1 : 0, scale: pressed ? (mode === "block" ? 0.95 : 0.85) : 1 }}
      transition={{ opacity: { duration: 0.15 }, scale: { type: "spring", stiffness: 400, damping: 30 } }}
    />,
    host,
  );
}
