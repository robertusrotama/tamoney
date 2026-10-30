"use client";

import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { useLocale, useT } from "@/components/I18n";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Popover } from "@/components/ui/Popover";
import { Segmented } from "@/components/ui/Segmented";
import { commonRanges, lastN, periodParams, type Period, type QuickUnit } from "@/lib/period";
import { RangeCalendar } from "./RangeCalendar";

const PERIOD_KEYS = ["p", "d", "dari", "sampai", "bulan"];

/**
 * Period changes are the only thing that needs the server (new date range → new rows). They run in a
 * transition so the UI answers at once (tab moves, skeleton shows) instead of freezing until data lands.
 */
const Ctx = createContext<{ pending: boolean; go: (params: Record<string, string>) => void }>({ pending: false, go: () => {} });
export const usePeriodPending = () => useContext(Ctx).pending;

export function PeriodProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const go = (params: Record<string, string>) => {
    // keep the client-side filters (they live in the URL too), replace only the period
    const next = new URLSearchParams(window.location.search);
    PERIOD_KEYS.forEach((k) => next.delete(k));
    for (const [k, v] of Object.entries(params)) next.set(k, v);
    start(() => router.push(`${pathname}?${next}`, { scroll: false }));
  };
  return <Ctx.Provider value={{ pending, go }}>{children}</Ctx.Provider>;
}

const RECENT_KEY = "tm_recent_ranges";
type Saved = { label: string; params: Record<string, string> };
// Recently used ranges live in this browser only — a convenience, so any storage failure just means "none".
const readRecent = (): Saved[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
};
const remember = (r: Saved) => {
  try {
    const next = [r, ...readRecent().filter((x) => JSON.stringify(x.params) !== JSON.stringify(r.params))].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
};

const UNITS: { value: QuickUnit; label: string }[] = [
  { value: "hari", label: "Hari" },
  { value: "minggu", label: "Minggu" },
  { value: "bulan", label: "Bulan" },
  { value: "tahun", label: "Tahun" },
];

const sectionTitle = "px-1 pb-1.5 text-[12px] font-semibold tracking-[0.04em] text-on-surface-variant uppercase";
const link =
  "rounded-[10px] px-2 py-1.5 text-left text-[14px] text-primary hover:bg-primary-container focus-visible:bg-primary-container focus-visible:outline-none";

/** Kibana-style panel: quick select, commonly used, recently used, and an absolute range calendar. */
function RangePanel({ period, today, onPick }: { period: Period; today: string; onPick: (r: Saved) => void }) {
  const t = useT();
  const locale = useLocale();
  const [n, setN] = useState("7");
  const [unit, setUnit] = useState<QuickUnit>("hari");
  const [custom, setCustom] = useState(false);
  const [recent] = useState(readRecent);
  const count = Math.max(1, Math.min(999, Number(n) || 1));

  if (custom)
    return (
      <div>
        <button type="button" onClick={() => setCustom(false)} className={`${link} mb-1 flex items-center gap-0.5`}>
          <Icon name="chevron_left" className="text-[18px]" /> {t("Kembali")}
        </button>
        <RangeCalendar
          start={period.start}
          end={period.end}
          today={today}
          onApply={(s, e) => onPick({ label: rangeText(s, e, locale), params: { p: "rentang", dari: s, sampai: e } })}
        />
      </div>
    );

  return (
    <div className="space-y-4 p-1.5">
      <section>
        <p className={sectionTitle}>{t("Pilih cepat")}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[15px]">{t("Terakhir")}</span>
            <div className="w-20">
              <Input
                inputMode="numeric"
                aria-label={t("Jumlah")}
                value={n}
                onChange={(e) => setN(e.target.value.replace(/\D/g, "").slice(0, 3))}
                className="h-10 text-center"
              />
            </div>
            <Button
              size="sm"
              className="ml-auto"
              onClick={() =>
                onPick({
                  label: t("{n} {unit} terakhir", { n: count, unit: t(UNITS.find((u) => u.value === unit)!.label).toLowerCase() }),
                  params: lastN(today, count, unit),
                })
              }
            >
              {t("Terapkan")}
            </Button>
          </div>
          <Segmented value={unit} onChange={setUnit} options={UNITS.map((u) => ({ ...u, label: t(u.label) }))} />
        </div>
      </section>

      <section>
        <p className={sectionTitle}>{t("Sering dipakai")}</p>
        <div className="grid grid-cols-2 gap-0.5">
          {commonRanges(today).map((r) => (
            <button key={r.label} type="button" className={link} onClick={() => onPick({ label: t(r.label), params: r.params })}>
              {t(r.label)}
            </button>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <p className={sectionTitle}>{t("Baru dipakai")}</p>
          <div className="flex flex-col">
            {recent.map((r) => (
              <button key={JSON.stringify(r.params)} type="button" className={`${link} flex items-center gap-2`} onClick={() => onPick(r)}>
                <Icon name="history" className="text-[16px] opacity-60" /> {r.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <Button variant="tonal" size="sm" className="w-full" onClick={() => setCustom(true)}>
        <Icon name="date_range" className="text-[16px]" /> {t("Rentang khusus…")}
      </Button>
    </div>
  );
}

const rangeText = (s: string, e: string, locale: string) => {
  const f = (d: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
  return `${f(s)} – ${f(e)}`;
};

/** ‹ [📅 period ▾] › — the panel picks any range; the arrows step through periods of the same length. */
export function PeriodBar({ period, today }: { period: Period; today: string }) {
  const { go, pending } = useContext(Ctx);
  const t = useT();
  const pick = (r: Saved) => {
    remember(r);
    go(r.params);
  };

  return (
    <div className="inline-flex h-12 max-w-full items-center rounded-full bg-card p-1">
      <IconButton onClick={() => go(periodParams(period, -1))} aria-label={t("Periode sebelumnya")} tone="primary">
        <Icon name="chevron_left" />
      </IconButton>
      <Popover
        align="left"
        width={360}
        ariaLabel={t("Pilih periode: {x}", { x: period.label })}
        label={
          <span className="flex items-center gap-1.5 text-[15px] font-semibold tabular-nums">
            {pending ? (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }} className="flex">
                <Icon name="progress_activity" className="text-[18px] text-primary" />
              </motion.span>
            ) : (
              <Icon name="calendar_month" className="text-[18px] text-primary" />
            )}
            {period.label}
          </span>
        }
      >
        {(close) => (
          <RangePanel
            period={period}
            today={today}
            onPick={(r) => {
              close();
              pick(r);
            }}
          />
        )}
      </Popover>
      <IconButton onClick={() => go(periodParams(period, 1))} disabled={!period.canNext} aria-label={t("Periode berikutnya")} tone="primary">
        <Icon name="chevron_right" />
      </IconButton>
    </div>
  );
}
