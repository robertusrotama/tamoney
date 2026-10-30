"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Ring, useFocusWithin } from "./FocusRing";

export const withDots = (raw: string) => raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** Rupiah input that shows dot separators while typing; the server parses them back. */
export function AmountInput({
  name,
  defaultValue,
  value,
  onChange,
  required = true,
  large,
}: {
  name: string;
  defaultValue?: number;
  value?: string;
  onChange?: (v: string) => void;
  required?: boolean;
  large?: boolean;
}) {
  const [own, setOwn] = useState(defaultValue ? withDots(String(defaultValue)) : "");
  const shown = value ?? own;
  const { focused, focusProps } = useFocusWithin();
  const text = large ? "text-[34px] font-bold tracking-[-0.02em]" : "text-[17px]";
  let digit = 0;
  return (
    <div {...focusProps} className={`relative flex items-baseline gap-1.5 rounded-[14px] bg-surface-dim px-4 ${large ? "py-3" : ""}`}>
      <Ring on={focused} />
      <span aria-hidden className={`font-semibold text-on-surface-variant ${large ? "text-[22px]" : "text-[17px]"}`}>
        Rp
      </span>
      <span className="relative min-w-0 flex-1">
      <input
        name={name}
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        required={required}
        value={shown}
        onChange={(e) => (onChange ?? setOwn)(withDots(e.target.value))}
        // The typed text is drawn by the layer below (same font metrics); the input keeps caret, selection and value.
        className={`min-h-12 w-full bg-transparent text-transparent tabular-nums caret-on-surface outline-none placeholder:text-on-surface-variant/60 ${text}`}
      />
      <span aria-hidden className={`pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre tabular-nums ${text}`}>
        <AnimatePresence initial={false}>
          {/* Keyed by digit ordinal + value (dots ignored): typing at the end animates only the new digit. */}
          {[...shown].map((ch, i) =>
            ch === "." ? (
              <span key={`dot-${i}`}>.</span>
            ) : (
              <motion.span
                key={`d${digit++}-${ch}`}
                className="inline-block"
                initial={{ opacity: 0, y: "35%", scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", bounce: 0.35, duration: 0.35 }}
              >
                {ch}
              </motion.span>
            ),
          )}
        </AnimatePresence>
      </span>
      </span>
    </div>
  );
}
