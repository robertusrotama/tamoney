"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/ui/Icon";
import { Mark, Popover } from "@/components/ui/Popover";

export type Option = { value: string; label: string; group?: string; hint?: string; icon?: string };

const row =
  "flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left text-[15px] hover:bg-surface-dim focus-visible:bg-surface-dim focus-visible:outline-none";

/** Checklist popover: any number of options. Empty selection means "all". */
export function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const set = new Set(selected);
  const toggle = (v: string) => onChange(set.has(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  const groups = [...new Set(options.map((o) => o.group ?? ""))];

  return (
    <Popover
      active={selected.length > 0}
      label={
        <>
          {label}
          {selected.length > 0 && (
            <motion.span key={selected.length} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="rounded-full bg-primary px-1.5 text-[12px] text-on-primary tabular-nums">
              {selected.length}
            </motion.span>
          )}
        </>
      }
    >
      <div className="flex items-center justify-between px-2.5 pt-1 pb-2">
        <span className="text-[13px] font-semibold text-on-surface-variant">{label}</span>
        <div className="flex gap-3 text-[13px] font-medium text-primary">
          <button type="button" onClick={() => onChange(options.map((o) => o.value))} className="hover:opacity-70">
            Pilih semua
          </button>
          <button type="button" onClick={() => onChange([])} disabled={!selected.length} className="hover:opacity-70 disabled:opacity-30">
            Hapus
          </button>
        </div>
      </div>
      <div role="group" aria-label={label} className="max-h-72 overflow-y-auto">
        {groups.map((g) => (
          <div key={g || "all"}>
            {g && <p className="px-2.5 pt-2 pb-1 text-[12px] font-semibold tracking-wide text-on-surface-variant uppercase">{g}</p>}
            {options
              .filter((o) => (o.group ?? "") === g)
              .map((o) => (
                <button key={o.value} type="button" role="checkbox" aria-checked={set.has(o.value)} onClick={() => toggle(o.value)} className={row}>
                  <Mark checked={set.has(o.value)} />
                  {o.icon && <Icon name={o.icon} className="text-[18px] text-on-surface-variant" />}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="text-[12px] text-on-surface-variant">{o.hint}</span>}
                </button>
              ))}
          </div>
        ))}
      </div>
    </Popover>
  );
}

/** Radio popover: exactly one option; closes on pick. */
export function SingleSelect({
  label,
  options,
  value,
  onChange,
  defaultValue,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  defaultValue: string;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <Popover active={value !== defaultValue} width={220} label={`${label}: ${current.label}`}>
      {(close) => (
        <div role="radiogroup" aria-label={label}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={o.value === value}
              onClick={() => {
                onChange(o.value);
                close();
              }}
              className={row}
            >
              <Mark checked={o.value === value} round />
              <span className="flex-1">{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

export function SearchField({ value, onChange, placeholder = "Cari catatan atau kategori" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="relative block">
      <span className="sr-only">Cari</span>
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[20px] text-on-surface-variant" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full bg-card pr-4 pl-11 text-[17px] outline-none placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}
