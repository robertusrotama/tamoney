"use client";

import { useState, type KeyboardEvent } from "react";
import { useT } from "@/components/I18n";
import { Icon } from "./Icon";
import { Mark, Popover } from "./Popover";

export type PickerOption = { value: string; label: string; icon?: string; group?: string };

/**
 * Replaces <select>: looks like an Input, opens a glass listbox. Posts its value through a hidden
 * input so it works inside plain forms. Long lists get a search box. ↑/↓ move, Enter picks, Esc closes.
 */
export function Picker({
  name,
  options,
  value,
  defaultValue = "",
  onChange,
  placeholder: placeholderProp,
  label,
}: {
  name?: string;
  options: PickerOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const t = useT();
  const placeholder = placeholderProp ?? t("Pilih");
  const [own, setOwn] = useState(defaultValue);
  const [q, setQ] = useState("");
  const current = value ?? own;
  const selected = options.find((o) => o.value === current);
  const searchable = options.length > 8;
  const shown = q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;
  const groups = [...new Set(shown.map((o) => o.group ?? ""))];

  const onKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=option]")];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    items[Math.max(0, Math.min(items.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))]?.focus();
  };

  return (
    <>
      {name && <input type="hidden" name={name} value={current} />}
      <Popover
        variant="field"
        width="trigger"
        ariaLabel={label ? `${label}: ${selected?.label ?? placeholder}` : undefined}
        label={
          selected ? (
            <>
              {selected.icon && <Icon name={selected.icon} className="text-[20px] text-on-surface-variant" />}
              <span className="truncate">{selected.label}</span>
            </>
          ) : (
            <span className="text-on-surface-variant">{placeholder}</span>
          )
        }
      >
        {(close) => (
          <div onKeyDown={onKeys}>
            {searchable && (
              <div className="relative mb-1.5">
                <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-on-surface-variant" />
                <input
                  // Mouse: type straight away. Touch: don't pop the keyboard just for opening the list.
                  autoFocus={window.matchMedia("(pointer: fine)").matches}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("Cari")}
                  aria-label={t("Cari pilihan")}
                  className="h-10 w-full rounded-[10px] bg-surface-dim pr-3 pl-9 text-[16px] outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
            <div role="listbox" aria-label={label} className="max-h-64 overflow-y-auto">
              {shown.length === 0 && <p className="px-3 py-2 text-[15px] text-on-surface-variant">{t("Tidak ada hasil")}</p>}
              {groups.map((g) => (
                <div key={g || "all"}>
                  {g && <p className="px-3 pt-2 pb-1 text-[12px] font-semibold tracking-wide text-on-surface-variant uppercase">{g}</p>}
                  {shown
                    .filter((o) => (o.group ?? "") === g)
                    .map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        role="option"
                        aria-selected={o.value === current}
                        autoFocus={!searchable && o.value === current}
                        onClick={() => {
                          setOwn(o.value);
                          onChange?.(o.value);
                          setQ("");
                          close();
                        }}
                        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[15px] hover:bg-surface-dim focus-visible:bg-surface-dim focus-visible:outline-none"
                      >
                        {o.icon && <Icon name={o.icon} className="text-[20px] text-on-surface-variant" />}
                        <span className="min-w-0 flex-1 truncate">{o.label}</span>
                        {o.value === current && <Mark checked round />}
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </Popover>
    </>
  );
}
