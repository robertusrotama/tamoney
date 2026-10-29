"use client";

import { motion } from "motion/react";
import { useId } from "react";

/** iOS segmented control; the thumb springs between options (shared layoutId per instance). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; tone?: string }[];
}) {
  const id = useId();
  return (
    <div role="radiogroup" className="flex rounded-[9px] bg-surface-dim p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`relative flex-1 rounded-[7px] py-1.5 text-[13px] font-semibold ${active ? (o.tone ?? "text-on-surface") : "text-on-surface-variant"}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[7px] bg-card shadow-[0_3px_8px_rgb(0_0_0/0.12),0_3px_1px_rgb(0_0_0/0.04)] dark:bg-[#636366] dark:shadow-none"              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
