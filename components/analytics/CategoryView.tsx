"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { TxActions } from "@/components/transactions/TxActions";
import { TxList, TxRow } from "@/components/transactions/TxRow";
import { Card, EmptyState, Label } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { Segmented } from "@/components/ui/Segmented";
import { Bone, ListBones } from "@/components/ui/Skeleton";
import { groupTxs, sortTxs, type Dir, type Grouping, type SortBy } from "@/lib/drilldown";
import { filterRows, periodParams, series, type Period, type Unit } from "@/lib/period";
import type { TxWithCategory } from "@/lib/queries";
import { pctChange } from "@/lib/reports";
import type { Category, Wallet } from "@/lib/types";
import { Delta, FilterBar, dayHeader, type FilterInit } from "./AnalyticsView";
import { DrillChart, SortControl } from "./Drilldown";
import { PeriodBar, usePeriodPending } from "./Period";
import { csv, useUrlState } from "./useUrlState";

const GROUPS: { value: Grouping; label: string }[] = [
  { value: "hari", label: "Harian" },
  { value: "minggu", label: "Mingguan" },
  { value: "bulan", label: "Bulanan" },
  { value: "semua", label: "Semua" },
];

const intl = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("id-ID", { ...o, timeZone: "UTC" });
const groupTitle = (key: string, g: Grouping) => {
  if (g === "hari") return dayHeader(key);
  if (g === "bulan") return intl({ month: "long", year: "numeric" }).format(new Date(`${key}-01T00:00:00Z`));
  const s = new Date(`${key}T00:00:00Z`);
  const e = new Date(s.getTime() + 6 * 86_400_000);
  return `Minggu ${intl({ day: "numeric", month: "short" }).format(s)} – ${intl({ day: "numeric", month: "short" }).format(e)}`;
};

/** Default bucket size for a period: days for a week/month, weeks for long ranges, months for a year. */
const defaultUnit = (p: Period): Unit =>
  p.kind === "tahun" ? "bulan" : (Date.parse(p.end) - Date.parse(p.start)) / 86_400_000 > 62 ? "minggu" : "hari";

/** Category deep dive body: rows for one category in the period; grouping/sort/filters are instant. */
export function CategoryView({
  category,
  rows,
  prevRows,
  kindTotal,
  wallets,
  categories,
  period,
  today,
  initial,
}: {
  category: Category;
  rows: TxWithCategory[];
  prevRows: TxWithCategory[];
  kindTotal: number;
  wallets: Wallet[];
  categories: Category[];
  period: Period;
  today: string;
  initial: FilterInit & { kelompok: string };
}) {
  const pending = usePeriodPending();
  const [f, set] = useUrlState(initial);
  const grouping = (GROUPS.some((g) => g.value === f.kelompok) ? f.kelompok : defaultUnit(period)) as Grouping;
  const by = (f.urut || "tanggal") as SortBy;
  const dir = (f.arah || "desc") as Dir;
  const filter = { q: f.q, wallets: csv(f.dompet) };
  const mine = filterRows(rows, filter);
  const prev = filterRows(prevRows, filter);
  const total = mine.reduce((s, t) => s + t.amount, 0);
  const delta = pctChange(total, prev.reduce((s, t) => s + t.amount, 0));
  const biggest = mine.reduce<TxWithCategory | null>((m, t) => (!m || t.amount > m.amount ? t : m), null);
  const sorted = sortTxs(mine, by, dir);
  const groups = groupTxs(sorted, grouping, by === "tanggal" ? dir : "desc");
  const chartUnit = grouping === "semua" ? defaultUnit(period) : grouping;
  const bars = series(mine, period.start, period.end, chartUnit);
  const names = new Map(wallets.map((w) => [w.id, w.name]));
  const walletName = (id: string) => names.get(id) ?? "—";
  const expense = category.kind === "expense";
  const tone = expense ? "var(--c-negative)" : "var(--c-positive)";
  const h2 = "text-[20px] font-bold tracking-[-0.01em]";

  return (
    <div className="space-y-6">
      <div className="space-y-3 px-1">
        <Link
          href={`/analitik?${new URLSearchParams(periodParams(period, 0))}`}
          className="inline-flex items-center gap-0.5 rounded-full pr-2 text-[17px] text-primary hover:opacity-70"
        >
          <Icon name="chevron_left" className="text-[22px]" /> Analitik
        </Link>
        <div className="flex items-center gap-3">
          <span className={`flex size-11 items-center justify-center rounded-[12px] text-white ${expense ? "bg-negative" : "bg-positive"}`}>
            <Icon name={category.icon} className="text-[24px]" filled />
          </span>
          <h1 className="large-title">{category.name}</h1>
        </div>
      </div>

      <PeriodBar period={period} today={today} />
      <FilterBar f={f} set={set} categories={categories} wallets={wallets} show={{ categories: false, kind: false }} />

      {pending ? (
        <Bone className="h-[104px] rounded-[14px]" />
      ) : (
        <section className="grid overflow-hidden rounded-[14px] bg-card sm:grid-cols-4">
          <div className="border-b border-outline p-4 sm:col-span-2 sm:border-r sm:border-b-0">
            <Label>Total {expense ? "pengeluaran" : "pemasukan"}</Label>
            <Money value={total} className="block text-[32px] leading-tight font-bold tracking-[-0.025em]" />
            <p className="text-[13px] text-on-surface-variant">
              {kindTotal ? Math.round((total / kindTotal) * 100) : 0}% dari semua {expense ? "pengeluaran" : "pemasukan"} · <Delta value={delta} invert={expense} /> vs
              periode sebelumnya
            </p>
          </div>
          <div className="border-b border-outline p-4 sm:border-r sm:border-b-0">
            <Label>Transaksi · rata-rata</Label>
            <p className="text-[24px] font-bold tracking-[-0.02em] tabular-nums">{mine.length}</p>
            <p className="text-[13px] text-on-surface-variant">
              <Money value={mine.length ? Math.round(total / mine.length) : 0} /> / transaksi
            </p>
          </div>
          <div className="p-4">
            <Label>Terbesar</Label>
            {biggest ? (
              <a href={`#tx-${biggest.id}`} className="block rounded-[8px] hover:opacity-80">
                <Money value={biggest.amount} className="block text-[24px] font-bold tracking-[-0.02em]" />
                <p className="truncate text-[13px] text-primary">{biggest.note || "Lihat transaksi"}</p>
              </a>
            ) : (
              <p className="text-[24px] font-bold">—</p>
            )}
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3 px-1">
          <h2 className={h2}>Per {chartUnit === "hari" ? "Hari" : chartUnit === "minggu" ? "Minggu" : "Bulan"}</h2>
          <div className="w-full sm:w-80">
            <Segmented value={grouping} onChange={(kelompok) => set({ kelompok })} options={GROUPS} />
          </div>
        </div>
        <Card>
          {pending ? (
            <Bone className="h-[180px]" />
          ) : mine.length === 0 ? (
            <EmptyState icon="bar_chart" title="Tidak ada transaksi di periode ini" />
          ) : (
            <DrillChart data={bars} color={tone} />
          )}
        </Card>
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3 px-1">
          <h2 className={h2}>
            Transaksi <span className="text-[15px] font-medium text-on-surface-variant tabular-nums">{mine.length}</span>
          </h2>
          <div className="w-full sm:w-80">
            <SortControl by={by} dir={dir} onChange={(urut, arah) => set({ urut, arah })} />
          </div>
        </div>
        {pending ? (
          <ListBones rows={6} />
        ) : sorted.length === 0 ? (
          <Card>
            <EmptyState icon="receipt_long" title="Tidak ada transaksi yang cocok" />
          </Card>
        ) : (
          <div className="space-y-5">
            {groups.map((g) => (
              <motion.div key={g.key} id={`g-${g.key}`} layout="position" className="scroll-mt-20">
                {grouping !== "semua" && (
                  <div className="mb-1.5 flex items-baseline justify-between px-1">
                    <p className="text-[13px] font-semibold text-on-surface-variant uppercase">{groupTitle(g.key, grouping)}</p>
                    <Money value={g.total} className="text-[13px] font-semibold text-on-surface-variant" />
                  </div>
                )}
                <TxList>
                  {g.items.map((t) => (
                    <div key={t.id} id={`tx-${t.id}`} className="scroll-mt-24">
                      <TxRow
                        tx={t}
                        walletName={walletName}
                        showDate={grouping !== "hari"}
                        actions={<TxActions tx={t} allWallets={wallets} categories={categories} />}
                      />
                    </div>
                  ))}
                </TxList>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
