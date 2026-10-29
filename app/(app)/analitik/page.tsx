import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitForm } from "@/components/analytics/AutoSubmitForm";
import { MonthPicker } from "@/components/analytics/MonthPicker";
import { CATEGORY_COLORS, CategoryDonut, TrendChart } from "@/components/analytics/Charts";
import { TxActions } from "@/components/transactions/TxActions";
import { TxList, TxRow } from "@/components/transactions/TxRow";
import { FadeIn } from "@/components/ui/FadeIn";
import { Card, EmptyState, Label } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { getCategories, getTransactionsBetween, getWallets } from "@/lib/queries";
import {
  categoryBreakdown,
  filterHistory,
  monthKey,
  monthlyTrend,
  monthRange,
  monthTotals,
  parseMonth,
  pctChange,
  shiftMonth,
} from "@/lib/reports";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Analitik · TaMoney" };

const PAGE_SIZE = 20;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const monthLabel = (m: string, month: "short" | "long" = "short") =>
  new Intl.DateTimeFormat("id-ID", { month, year: month === "long" ? "numeric" : undefined, timeZone: "UTC" }).format(new Date(`${m}-01`));

function Delta({ value, invert }: { value: number | null; invert?: boolean }) {
  if (value === null) return <span className="text-on-surface-variant">—</span>;
  const good = invert ? value <= 0 : value >= 0;
  return (
    <span className={`text-[13px] font-medium tabular-nums ${good ? "text-positive" : "text-negative"}`}>
      {value >= 0 ? "↑" : "↓"} {Math.abs(Math.round(value * 100))}%
    </span>
  );
}

export default async function AnalitikPage({ searchParams }: PageProps<"/analitik">) {
  const sp = await searchParams;
  const currentMonth = monthKey(new Date().toISOString());
  const month = parseMonth(one(sp.bulan), currentMonth);
  const filter = { q: one(sp.q), wallet: one(sp.dompet), category: one(sp.kategori), kind: one(sp.jenis) };
  const page = Math.max(1, Number(one(sp.hal)) || 1);

  const { supabase } = await requireUser();
  const [wallets, categories, txs] = await Promise.all([
    getWallets(supabase, true),
    getCategories(supabase),
    getTransactionsBetween(supabase, monthRange(shiftMonth(month, -5)).start, monthRange(month).end),
  ]);

  const thisMonth = txs.filter((t) => monthKey(t.occurred_at) === month);
  const lastMonth = txs.filter((t) => monthKey(t.occurred_at) === shiftMonth(month, -1));
  const now = monthTotals(thisMonth);
  const prev = monthTotals(lastMonth);
  const trend = monthlyTrend(txs, month).map((m) => ({ ...m, label: monthLabel(m.month) }));
  const breakdown = categoryBreakdown(thisMonth, lastMonth);

  const history = filterHistory(thisMonth, filter);
  const pages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const shown = history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const names = new Map(wallets.map((w) => [w.id, w.name]));
  const walletName = (id: string) => names.get(id) ?? "—";
  const pageHref = (p: number) => `?${new URLSearchParams({ ...Object.fromEntries(Object.entries({ bulan: month, q: filter.q, dompet: filter.wallet, kategori: filter.category, jenis: filter.kind }).filter(([, v]) => v)), hal: String(p) })}`;

  const h2 = "mb-2 px-1 text-[20px] font-bold tracking-[-0.01em]";

  return (
    <div className="space-y-8">
      <AutoSubmitForm id="filter" />
      {/* the month lives in the URL; the filter form must carry it so a filter change keeps the month */}
      <input form="filter" type="hidden" name="bulan" value={month} />
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <h1 className="large-title">Analitik</h1>
        <MonthPicker month={month} current={currentMonth} />
      </div>

      {/* Inset-grouped summary: one card, three rows */}
      <section className="grid overflow-hidden rounded-[14px] bg-card sm:grid-cols-3">
        {[
          { label: "Pemasukan", value: now.income, delta: <Delta value={pctChange(now.income, prev.income)} /> },
          { label: "Pengeluaran", value: now.expense, delta: <Delta value={pctChange(now.expense, prev.expense)} invert /> },
          { label: now.net >= 0 ? "Surplus" : "Defisit", value: now.net, delta: null, signed: true },
        ].map((c) => (
          <div key={c.label} className="border-b border-outline p-4 last:border-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
            <Label>{c.label}</Label>
            <Money value={c.value} sign={c.signed ? "auto" : "none"} className="block text-[24px] font-bold tracking-[-0.02em]" />
            {c.delta && <p className="text-[13px] text-on-surface-variant">{c.delta} vs bulan lalu</p>}
          </div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="min-w-0">
          <h2 className={h2}>Tren 6 Bulan</h2>
          <Card>
            <p className="mb-1 flex gap-4 text-[13px] text-on-surface-variant">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-positive" />Masuk</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-negative" />Keluar</span>
            </p>
            <TrendChart data={trend} />
          </Card>
        </section>

        <section className="min-w-0">
          <h2 className={h2}>Kategori</h2>
          <Card>
            {breakdown.length === 0 ? (
              <EmptyState icon="donut_large" title="Belum ada pengeluaran" />
            ) : (
              <>
                <CategoryDonut data={breakdown} />
                <ol>
                  {breakdown.map((c, i) => (
                    <li key={c.categoryId} className="flex items-center gap-3 border-b border-outline py-2 last:border-0">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px]">{c.name}</p>
                        <p className="text-[13px] text-on-surface-variant tabular-nums">
                          {Math.round(c.share * 100)}% · <Money value={c.amount} />
                        </p>
                      </div>
                      <Delta value={c.deltaVsPrev} invert />
                    </li>
                  ))}
                </ol>
              </>
            )}
          </Card>
        </section>
      </div>

      <section>
        <h2 className={h2}>Riwayat</h2>
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-on-surface-variant" />
            <Input form="filter" name="q" type="search" defaultValue={filter.q} placeholder="Cari" className="bg-card pl-9" />
          </div>
          <Select form="filter" name="dompet" defaultValue={filter.wallet ?? ""} aria-label="Dompet" className="bg-card">
            <option value="">Semua dompet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </Select>
          <Select form="filter" name="kategori" defaultValue={filter.category ?? ""} aria-label="Kategori" className="bg-card">
            <option value="">Semua kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.kind === "income" ? "masuk" : "keluar"})</option>
            ))}
          </Select>
          <Select form="filter" name="jenis" defaultValue={filter.kind ?? "all"} aria-label="Jenis" className="bg-card">
            <option value="all">Semua jenis</option>
            <option value="income">Masuk</option>
            <option value="expense">Keluar</option>
            <option value="transfer">Transfer</option>
          </Select>
        </div>

        {shown.length === 0 ? (
          <Card>
            <EmptyState icon="receipt_long" title="Tidak ada transaksi" />
          </Card>
        ) : (
          <TxList>
            {shown.map((t, i) => (
              <FadeIn key={t.id} index={i}>
                <TxRow tx={t} walletName={walletName} showDate actions={<TxActions tx={t} allWallets={wallets} categories={categories} />} />
              </FadeIn>
            ))}
          </TxList>
        )}

        <div className="mt-3 flex items-center justify-between px-1 text-[13px] text-on-surface-variant">
          <p>{history.length} transaksi</p>
          {pages > 1 && (
            <nav className="flex items-center gap-1" aria-label="Halaman">
              {page > 1 && <Link href={pageHref(page - 1)} aria-label="Sebelumnya" className="flex size-8 items-center justify-center rounded-full bg-card text-primary"><Icon name="chevron_left" /></Link>}
              <span className="px-2 tabular-nums">{page} / {pages}</span>
              {page < pages && <Link href={pageHref(page + 1)} aria-label="Berikutnya" className="flex size-8 items-center justify-center rounded-full bg-card text-primary"><Icon name="chevron_right" /></Link>}
            </nav>
          )}
        </div>
      </section>
    </div>
  );
}
