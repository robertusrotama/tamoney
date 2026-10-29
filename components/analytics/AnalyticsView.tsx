"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { TxActions } from "@/components/transactions/TxActions";
import { TxList, TxRow } from "@/components/transactions/TxRow";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, Label } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { Bone, ListBones } from "@/components/ui/Skeleton";
import { groupTxs, sortTxs, type Dir, type SortBy } from "@/lib/drilldown";
import { filterRows, periodParams, type Period } from "@/lib/period";
import type { TxWithCategory } from "@/lib/queries";
import { categoryBreakdown, monthTotals, pctChange } from "@/lib/reports";
import type { Category, Wallet } from "@/lib/types";
import { CATEGORY_COLORS, CategoryDonut } from "./Charts";
import { SortControl } from "./Drilldown";
import { MultiSelect, SearchField, SingleSelect } from "./Filters";
import { PeriodBar, usePeriodPending } from "./Period";
import { csv, useUrlState } from "./useUrlState";

export type FilterInit = { q: string; kategori: string; dompet: string; jenis: string; urut: string; arah: string };

const KIND_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "expense", label: "Keluar" },
  { value: "income", label: "Masuk" },
  { value: "transfer", label: "Transfer" },
];
const PAGE = 60;

export function Delta({ value, invert }: { value: number | null; invert?: boolean }) {
  if (value === null) return <span className="text-on-surface-variant">—</span>;
  const good = invert ? value <= 0 : value >= 0;
  return (
    <span className={`text-[13px] font-medium tabular-nums ${good ? "text-positive" : "text-negative"}`}>
      {value >= 0 ? "↑" : "↓"} {Math.abs(Math.round(value * 100))}%
    </span>
  );
}

export const dayHeader = (d: string) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

/** Filter bar shared by Analitik and the category deep dive: search, multi-select category/wallet, single kind. */
export function FilterBar({
  f,
  set,
  categories,
  wallets,
  show = { categories: true, kind: true },
}: {
  f: FilterInit;
  set: (p: Partial<FilterInit>) => void;
  categories: Category[];
  wallets: Wallet[];
  show?: { categories?: boolean; kind?: boolean };
}) {
  const active = !!(f.q || f.kategori || f.dompet || (f.jenis && f.jenis !== "all"));
  return (
    <div className="space-y-2.5">
      <SearchField value={f.q} onChange={(q) => set({ q })} />
      <div className="flex flex-wrap items-center gap-2">
        {show.categories && (
          <MultiSelect
            label="Kategori"
            selected={csv(f.kategori)}
            onChange={(v) => set({ kategori: v.join(",") })}
            options={categories.map((c) => ({ value: c.id, label: c.name, icon: c.icon, group: c.kind === "expense" ? "Pengeluaran" : "Pemasukan" }))}
          />
        )}
        <MultiSelect
          label="Dompet"
          selected={csv(f.dompet)}
          onChange={(v) => set({ dompet: v.join(",") })}
          options={wallets.map((w) => ({ value: w.id, label: w.name, hint: w.archived_at ? "Arsip" : undefined }))}
        />
        {show.kind && <SingleSelect label="Jenis" value={f.jenis || "all"} defaultValue="all" onChange={(jenis) => set({ jenis })} options={KIND_OPTIONS} />}
        <AnimatePresence>
          {active && (
            <motion.span key="reset" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <Button variant="ghost" size="sm" className="h-9" onClick={() => set({ q: "", kategori: "", dompet: "", jenis: "" })}>
                <Icon name="close" className="text-[16px]" /> Reset
              </Button>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Analitik body. The server hands over one period's rows (plus the previous period's for comparison);
 * everything else — search, filters, sort, totals, donut — is computed here, so it's instant.
 */
export function AnalyticsView({
  rows,
  prevRows,
  wallets,
  categories,
  period,
  today,
  initial,
}: {
  rows: TxWithCategory[];
  prevRows: TxWithCategory[];
  wallets: Wallet[];
  categories: Category[];
  period: Period;
  today: string;
  initial: FilterInit;
}) {
  const pending = usePeriodPending();
  const [f, set] = useUrlState(initial);
  const [limit, setLimit] = useState(PAGE);
  const filter = { q: f.q, categories: csv(f.kategori), wallets: csv(f.dompet), kind: f.jenis };
  const cur = filterRows(rows, filter);
  const prev = filterRows(prevRows, filter);
  const now = monthTotals(cur);
  const before = monthTotals(prev);
  const breakdown = categoryBreakdown(cur, prev);
  const by = (f.urut || "tanggal") as SortBy;
  const dir = (f.arah || "desc") as Dir;
  const sorted = sortTxs(cur, by, dir);
  const groups = groupTxs(sorted.slice(0, limit), by === "tanggal" ? "hari" : "semua", dir);
  const names = new Map(wallets.map((w) => [w.id, w.name]));
  const walletName = (id: string) => names.get(id) ?? "—";
  const periodQs = new URLSearchParams(periodParams(period, 0)).toString();
  const h2 = "text-[20px] font-bold tracking-[-0.01em]";

  return (
    <div className="space-y-6">
      <PeriodBar period={period} today={today} />
      <FilterBar f={f} set={(p) => (setLimit(PAGE), set(p))} categories={categories} wallets={wallets} />

      {pending ? (
        <Bone className="h-[104px] rounded-[14px]" />
      ) : (
        <section className="grid overflow-hidden rounded-[14px] bg-card sm:grid-cols-3">
          {[
            { label: "Pemasukan", value: now.income, delta: <Delta value={pctChange(now.income, before.income)} /> },
            { label: "Pengeluaran", value: now.expense, delta: <Delta value={pctChange(now.expense, before.expense)} invert /> },
            { label: now.net >= 0 ? "Surplus" : "Defisit", value: now.net, delta: null, signed: true },
          ].map((c) => (
            <div key={c.label} className="border-b border-outline p-4 last:border-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
              <Label>{c.label}</Label>
              <Money value={c.value} sign={c.signed ? "auto" : "none"} className="block text-[24px] font-bold tracking-[-0.02em]" />
              {c.delta && <p className="text-[13px] text-on-surface-variant">{c.delta} vs periode sebelumnya</p>}
            </div>
          ))}
        </section>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        {/* Kategori first in the DOM on mobile reads top→bottom; on desktop it sits right */}
        <section className="min-w-0 lg:order-2 lg:sticky lg:top-20">
          <h2 className={`mb-2 px-1 ${h2}`}>Kategori</h2>
          <Card>
            {pending ? (
              <div className="space-y-3">
                <Bone className="mx-auto size-40 rounded-full" />
                <Bone className="h-4" />
                <Bone className="h-4 w-4/5" />
              </div>
            ) : breakdown.length === 0 ? (
              <EmptyState icon="donut_large" title="Belum ada pengeluaran" />
            ) : (
              <>
                <CategoryDonut data={breakdown} links={breakdown.map((c) => `/analitik/kategori/${c.categoryId}?${periodQs}`)} />
                <ol>
                  {breakdown.map((c, i) => (
                    <li key={c.categoryId} className="border-b border-outline last:border-0">
                      <Link href={`/analitik/kategori/${c.categoryId}?${periodQs}`} className="-mx-2 flex items-center gap-3 rounded-[10px] px-2 py-2 hover:bg-surface-dim">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px]">{c.name}</p>
                          <p className="text-[13px] text-on-surface-variant tabular-nums">
                            {Math.round(c.share * 100)}% · <Money value={c.amount} />
                          </p>
                        </div>
                        <Delta value={c.deltaVsPrev} invert />
                        <Icon name="chevron_right" className="text-[20px] text-on-surface-variant/60" />
                      </Link>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </Card>
        </section>

        <section className="min-w-0 lg:order-1">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3 px-1">
            <h2 className={h2}>
              Riwayat <span className="text-[15px] font-medium text-on-surface-variant tabular-nums">{cur.length}</span>
            </h2>
            <div className="w-full sm:w-80">
              <SortControl by={by} dir={dir} onChange={(urut, arah) => set({ urut, arah })} />
            </div>
          </div>
          {pending ? (
            <ListBones rows={8} />
          ) : sorted.length === 0 ? (
            <Card>
              <EmptyState icon="receipt_long" title="Tidak ada transaksi" />
            </Card>
          ) : (
            <div className="space-y-5">
              {groups.map((g) => (
                <div key={g.key}>
                  {g.key !== "all" && <p className="mb-1.5 px-1 text-[13px] font-semibold text-on-surface-variant uppercase">{dayHeader(g.key)}</p>}
                  <TxList>
                    {g.items.map((t) => (
                      <TxRow
                        key={t.id}
                        tx={t}
                        walletName={walletName}
                        showDate={g.key === "all"}
                        actions={<TxActions tx={t} allWallets={wallets} categories={categories} />}
                      />
                    ))}
                  </TxList>
                </div>
              ))}
              {sorted.length > limit && (
                <div className="flex justify-center">
                  <Button variant="tonal" onClick={() => setLimit((l) => l + PAGE)}>
                    Tampilkan lebih banyak ({sorted.length - limit})
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
