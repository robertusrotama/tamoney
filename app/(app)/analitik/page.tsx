import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitForm } from "@/components/analytics/AutoSubmitForm";
import { CATEGORY_COLORS, CategoryDonut, TrendChart } from "@/components/analytics/Charts";
import { TxActions } from "@/components/transactions/TxActions";
import { TxRow } from "@/components/transactions/TxRow";
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

export const metadata: Metadata = { title: "Analitik & Riwayat · TaMoney" };

const PAGE_SIZE = 20;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const monthLabel = (m: string, month: "short" | "long" = "short") =>
  new Intl.DateTimeFormat("id-ID", { month, year: month === "long" ? "numeric" : undefined, timeZone: "UTC" }).format(new Date(`${m}-01`));

function Delta({ value, invert }: { value: number | null; invert?: boolean }) {
  if (value === null) return <span className="text-on-surface-variant">—</span>;
  const good = invert ? value <= 0 : value >= 0;
  return (
    <span className={`font-mono text-xs ${good ? "text-positive" : "text-negative"}`}>
      {value >= 0 ? "▲" : "▼"} {Math.abs(Math.round(value * 100))}%
    </span>
  );
}

export default async function AnalitikPage({ searchParams }: PageProps<"/analitik">) {
  const sp = await searchParams;
  const month = parseMonth(one(sp.bulan), monthKey(new Date().toISOString()));
  const filter = { q: one(sp.q), wallet: one(sp.dompet), category: one(sp.kategori), kind: one(sp.jenis) };
  const page = Math.max(1, Number(one(sp.hal)) || 1);

  const { supabase } = await requireUser();
  const [wallets, categories, txs] = await Promise.all([
    getWallets(supabase, { includeArchived: true }),
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

  return (
    <div className="space-y-8">
      <AutoSubmitForm id="filter" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Analitik & Riwayat</h1>
            <p className="text-sm text-on-surface-variant">Ringkasan arus kas, porsi kategori, dan semua transaksi {monthLabel(month, "long")}.</p>
          </div>
          <label className="flex items-center gap-2 rounded-full border border-outline bg-card px-4 py-2 text-sm">
            <Icon name="calendar_month" className="text-lg text-on-surface-variant" />
            <span className="sr-only">Pilih bulan</span>
            <input form="filter" type="month" name="bulan" defaultValue={month} className="bg-transparent font-semibold outline-none" />
          </label>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <Card>
            <Label>Total pemasukan</Label>
            <Money value={now.income} className="mt-2 block text-2xl font-bold" />
            <p className="mt-1 text-xs text-on-surface-variant">
              <Delta value={pctChange(now.income, prev.income)} /> vs bulan lalu
            </p>
          </Card>
          <Card>
            <Label>Total pengeluaran</Label>
            <Money value={now.expense} className="mt-2 block text-2xl font-bold" />
            <p className="mt-1 text-xs text-on-surface-variant">
              <Delta value={pctChange(now.expense, prev.expense)} invert /> vs bulan lalu
            </p>
          </Card>
          <Card>
            <Label>Selisih ({now.net >= 0 ? "surplus" : "defisit"})</Label>
            <Money value={now.net} sign="auto" className="mt-2 block text-2xl font-bold" />
          </Card>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Tren Arus Kas</h2>
              <p className="flex gap-3 font-mono text-[11px] text-on-surface-variant">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-positive" />Pemasukan</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-negative" />Pengeluaran</span>
              </p>
            </div>
            <TrendChart data={trend} />
          </Card>

          <Card>
            <h2 className="text-lg font-bold">Porsi Kategori Pengeluaran</h2>
            {breakdown.length === 0 ? (
              <EmptyState icon="donut_large" title="Belum ada pengeluaran bulan ini" />
            ) : (
              <>
                <CategoryDonut data={breakdown} />
                <ol className="space-y-2">
                  {breakdown.map((c, i) => (
                    <li key={c.categoryId} className="flex items-center gap-3 text-sm">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{c.name}</p>
                        <p className="font-mono text-[11px] text-on-surface-variant">
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
        </div>

        <Card>
          <h2 className="mb-4 text-lg font-bold">Riwayat Transaksi</h2>
          <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <Input form="filter" name="q" type="search" defaultValue={filter.q} placeholder="Cari catatan atau kategori…" />
            <Select form="filter" name="dompet" defaultValue={filter.wallet ?? ""} aria-label="Dompet">
              <option value="">Semua dompet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
            <Select form="filter" name="kategori" defaultValue={filter.category ?? ""} aria-label="Kategori">
              <option value="">Semua kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.kind === "income" ? "masuk" : "keluar"})</option>
              ))}
            </Select>
            <Select form="filter" name="jenis" defaultValue={filter.kind ?? "all"} aria-label="Jenis">
              <option value="all">Semua jenis</option>
              <option value="income">Masuk</option>
              <option value="expense">Keluar</option>
              <option value="transfer">Transfer</option>
            </Select>
          </div>

          {shown.length === 0 ? (
            <EmptyState icon="receipt_long" title="Tidak ada transaksi" />
          ) : (
            <div className="space-y-2">
              {shown.map((t) => (
                <TxRow key={t.id} tx={t} walletName={walletName} showDate actions={<TxActions tx={t} allWallets={wallets} categories={categories} />} />
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-sm text-on-surface-variant">
            <p>{history.length} transaksi</p>
            {pages > 1 && (
              <nav className="flex items-center gap-1" aria-label="Halaman">
                {page > 1 && <Link href={pageHref(page - 1)} className="rounded-full px-3 py-1 hover:bg-surface-dim">‹</Link>}
                <span className="font-mono">{page} / {pages}</span>
                {page < pages && <Link href={pageHref(page + 1)} className="rounded-full px-3 py-1 hover:bg-surface-dim">›</Link>}
              </nav>
            )}
          </div>
        </Card>
    </div>
  );
}
