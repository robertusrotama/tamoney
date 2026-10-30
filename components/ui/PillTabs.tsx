"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { Icon } from "./Icon";

/** Rounded pill tabs with an icon; the active pill (blue, or the option's `tone` bg class) glides between options. */
export function PillTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon: string; tone?: string }[];
}) {
  const id = useId();
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <motion.button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            whileTap={{ scale: 0.96 }}
            className={`relative flex h-9 shrink-0 items-center rounded-full px-3.5 text-[14px] font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
              active ? "text-on-primary" : "text-on-surface-variant hover:bg-surface-dim hover:text-on-surface"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`pill-${id}`}
                className={`absolute inset-0 rounded-full ${o.tone ?? "bg-primary"}`}
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}
            <Icon name={o.icon} className={`relative -ms-0.5 me-1.5 text-[17px] ${active ? "" : "opacity-60"}`} filled={active} />
            <span className="relative">{o.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
