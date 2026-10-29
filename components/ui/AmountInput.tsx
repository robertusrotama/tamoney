"use client";

import { useState } from "react";

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
  return (
    <div
      className={`flex items-baseline gap-1.5 rounded-[14px] bg-surface-dim px-4 focus-within:ring-2 focus-within:ring-primary ${large ? "py-3" : ""}`}
    >
      <span aria-hidden className={`font-semibold text-on-surface-variant ${large ? "text-[22px]" : "text-[17px]"}`}>
        Rp
      </span>
      <input
        name={name}
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        required={required}
        value={shown}
        onChange={(e) => (onChange ?? setOwn)(withDots(e.target.value))}
        className={`min-h-12 w-full bg-transparent tabular-nums outline-none placeholder:text-on-surface-variant/60 ${
          large ? "text-[34px] font-bold tracking-[-0.02em]" : "text-[17px]"
        }`}
      />
    </div>
  );
}
