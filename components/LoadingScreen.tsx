"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useT } from "@/components/I18n";

const LINES = [
  "Tunggu, lagi diitung duitnya…",
  "Lagi nyari dompet kamu…",
  "Wah, duitnya banyak banget…",
  "Ngumpulin receh di bawah kasur…",
  "Ngerapihin struk belanjaan…",
  "Nanya kasir soal kembalian…",
  "Bentar, celengannya lagi dibuka…",
  "Hampir siap, tinggal dihitung ulang…",
];

const STEP_MS = 1100;
const DASHES = ["#34c759", "#ffcc00", "#ff2d55", "#ff9500", "#ff3b30", "#34c759", "#ffcc00", "#ff9500", "#ff2d55", "#ff3b30", "#ffcc00", "#34c759"];

/** Ring of colored dashes, turning slowly (opacity-only fallback under Reduce Motion via MotionConfig). */
function Spinner() {
  return (
    <motion.svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      aria-hidden
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
    >
      {DASHES.map((c, i) => {
        const a = (i / DASHES.length) * Math.PI * 2;
        const r1 = 11;
        const r2 = 16;
        return (
          <line
            key={i}
            x1={18 + Math.cos(a) * r1}
            y1={18 + Math.sin(a) * r1}
            x2={18 + Math.cos(a) * r2}
            y2={18 + Math.sin(a) * r2}
            stroke={c}
            strokeWidth="3"
            strokeLinecap="round"
            opacity={0.35 + (i / DASHES.length) * 0.65}
          />
        );
      })}
    </motion.svg>
  );
}

/**
 * First-load screen (app/loading.tsx): streams before any data, so Safari never sits on a blank page.
 * A new playful line appears every ~1s; the newest is bright, older ones fade out above it.
 */
export function LoadingScreen() {
  const t = useT();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, LINES.length - 1)), STEP_MS);
    return () => clearInterval(id);
  }, []);

  const shown = LINES.slice(0, step + 1)
    .map((line, i) => ({ line, n: i + 1 }))
    .slice(-3);

  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3">
          <Spinner />
          <p className="text-[22px] font-semibold tracking-[-0.01em] text-on-surface">{t("Menyiapkan TaMoney…")}</p>
        </div>
        <ol className="mt-6 space-y-3 font-[ui-monospace,_SFMono-Regular,_Menlo,_monospace] text-[15px]">
          <AnimatePresence initial={false}>
            {shown.map(({ line, n }, i) => {
              const age = shown.length - 1 - i; // 0 = newest
              return (
                <motion.li
                  key={n}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: age === 0 ? 1 : age === 1 ? 0.6 : 0.35, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.45 }}
                  className="flex gap-5"
                >
                  <span className="w-4 text-right text-on-surface-variant tabular-nums">{n}</span>
                  <span className="text-on-surface">{t(line)}</span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      </div>
    </div>
  );
}
