"use client";

import { useState } from "react";
import { inputClass } from "./Field";

export const withDots = (raw: string) => raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** Rupiah input that shows dot separators while typing; the server parses them back. */
export function AmountInput({
  name,
  defaultValue,
  value,
  onChange,
  required = true,
}: {
  name: string;
  defaultValue?: number;
  value?: string;
  onChange?: (v: string) => void;
  required?: boolean;
}) {
  const [own, setOwn] = useState(defaultValue ? withDots(String(defaultValue)) : "");
  const shown = value ?? own;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-outline bg-surface pl-4 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary">
      <span className="font-mono text-sm text-on-surface-variant">Rp</span>
      <input
        name={name}
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        required={required}
        value={shown}
        onChange={(e) => (onChange ?? setOwn)(withDots(e.target.value))}
        className={`${inputClass} border-0 bg-transparent pl-0 font-mono text-lg tabular-nums focus:ring-0`}
      />
    </div>
  );
}
