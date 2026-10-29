"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { MonthGrid } from "./MonthGrid";
import { Popover } from "./Popover";

const nice = (d: string) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

/** Replaces <input type="date">: field-looking trigger + calendar popover. Posts YYYY-MM-DD via a hidden input. */
export function DateField({
  name,
  defaultValue,
  today,
  label,
  max,
  onChange,
}: {
  name: string;
  defaultValue: string;
  today: string;
  label?: string;
  max?: string | null;
  onChange?: (d: string) => void;
}) {
  const [value, setOwn] = useState(defaultValue);
  const setValue = (d: string) => {
    setOwn(d);
    onChange?.(d);
  };
  const [view, setView] = useState(defaultValue.slice(0, 7));
  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover
        variant="field"
        width={300}
        ariaLabel={label ? `${label}: ${nice(value)}` : undefined}
        label={
          <>
            <Icon name="calendar_today" className="text-[18px] text-on-surface-variant" />
            <span className="truncate">{value === today ? `Hari ini · ${nice(value)}` : nice(value)}</span>
          </>
        }
      >
        {(close) => (
          <div className="p-1.5">
            <MonthGrid
              view={view}
              onView={setView}
              today={today}
              max={max}
              layoutId={`date-${name}`}
              edge={(d) => d === value}
              onPick={(d) => {
                setValue(d);
                close();
              }}
            />
            <div className="mt-2 flex justify-end border-t border-outline pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValue(today);
                  setView(today.slice(0, 7));
                  close();
                }}
              >
                Hari ini
              </Button>
            </div>
          </div>
        )}
      </Popover>
    </>
  );
}
