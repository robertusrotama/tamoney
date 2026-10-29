import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoSubmitForm } from "@/components/analytics/AutoSubmitForm";
import { DrillChart, SortControl, UrlSegmented } from "@/components/analytics/Drilldown";
import { MonthPicker } from "@/components/analytics/MonthPicker";
import { TxActions } from "@/components/transactions/TxActions";
import { TxList, TxRow } from "@/components/transactions/TxRow";
import { Card, EmptyState, Label } from "@/components/ui/EmptyState";
import { FadeIn } from "@/components/ui/FadeIn";
import { Icon } from "@/components/ui/Icon";
import { Input, Select } from "@/components/ui/Field";
import { Money } from "@/components/ui/Money";
import { daySeries, groupTxs, sortTxs, weekSeries, type Dir, type Grouping, type SortBy } from "@/lib/drilldown";
import { getCategories, getTransactionsBetween, getWallets } from "@/lib/queries";
import { filterHistory, monthKey, monthRange, monthTotals, parseMonth, pctChange, shiftMonth, wibDate } from "@/lib/reports";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Kategori · Analitik · TaMoney" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const pick = <T extends string>(v: string | undefined, allowed: readonly T[], fallback: T) => (allowed.includes(v as T) ? (v as T) : fallback);
const dayLabel = (d: string) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
const monthShort = (m: string) => new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));

export default async function KategoriPage({ params, searchParams }: PageProps<"/analitik/kategori/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const currentMonth = monthKey(new Date().toISOString());
  const month = parseMonth(one(sp.bulan), currentMonth);
  const grouping = pick(one(sp.kelompok), ["harian", "mingguan", "semua"] as const, "harian") as Grouping;
  const by = pick(one(sp.urut), ["tanggal", "nominal", "nama"] as const, "tanggal") as SortBy;
  const dir = pick(one(sp.arah), ["asc", "desc"] as const, "desc") as Dir;
  const filter = { q: one(sp.q), wallet: one(sp.dompet) };

  const { supabase } = await requireUser();
  const [categories, wallets, txs] = await Promise.all([
    getCategories(supabase),
    getWallets(supabase, true),
    getTransactionsBetween(supabase, monthRange(shiftMonth(month, -1)).start, monthRange(month).end),
  ]);
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const inMonth = txs.filter((t) => monthKey(t.occurred_at) === month);
  const mine = inMonth.filter((t) => t.category_id === id);
  const prevTotal = txs.filter((t) => monthKey(t.occurred_at) === shiftMonth(month, -1) && t.category_id === id).reduce((s, t) => s + t.amount, 0);
  const total = mine.reduce((s, t) => s + t.amount, 0);
  const kindTotal = category.kind === "expense" ? monthTotals(inMonth).expense : monthTotals(inMonth).income;
  const share = kindTotal ? total / kindTotal : 0;
  const delta = pctChange(total, prevTotal);

  const shown = sortTxs(filterHistory(mine, filter), by, dir);
  const groups = groupTxs(shown, grouping, by === "tanggal" ? dir : "desc");
  const biggest = mine.reduce<(typeof mine)[number] | null>((m, t) => (!m || t.amount > m.amount ? t : m), null);
  const series = grouping === "mingguan" ? weekSeries(mine, month) : daySeries(mine, month);
  const names = new Map(wallets.map((w) => [w.id, w.name]));
  const walletName = (wid: string) => names.get(wid) ?? "—";
  const tone = category.kind === "expense" ? "var(--c-negative)" : "var(--c-positive)";
  const groupLabel = (key: string) => {
    if (grouping === "harian") return dayLabel(key);
    const w = weekSeries([], month).find((x) => x.key === key)!;
    return `Minggu ${key.slice(1)} · ${w.label} ${monthShort(month)}`;
  };
  const h2 = "mb-2 px-1 text-[20px] font-bold tracking-[-0.01em]";

  return (
    <div className="space-y-8">
      <AutoSubmitForm id="filter" />
      {/* the filter form must carry the URL state it doesn't own, or submitting it would reset them */}
      {Object.entries({ bulan: month, kelompok: grouping, urut: by, arah: dir }).map(([k, v]) => (
        <input key={k} form="filter" type="hidden" name={k} value={v} />
      ))}

      <div className="space-y-3 px-1">
        <Link href={`/analitik?bulan=${month}`} className="inline-flex items-center gap-0.5 text-[17px] text-primary">
          <Icon name="chevron_left" className="text-[22px]" /> Analitik
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-11 items-center justify-center rounded-[12px] text-white ${category.kind === "expense" ? "bg-negative" : "bg-positive"}`}
            >
              <Icon name={category.icon} className="text-[24px]" filled />
            </span>
            <h1 className="large-title">{category.name}</h1>
          </div>
          <MonthPicker month={month} current={currentMonth} />
        </div>
      </div>

      <section className="grid overflow-hidden rounded-[14px] bg-card sm:grid-cols-4">
        <div className="border-b border-outline p-4 sm:col-span-2 sm:border-r sm:border-b-0">
          <Label>Total {category.kind === "expense" ? "pengeluaran" : "pemasukan"}</Label>
          <Money value={total} className="block text-[32px] leading-tight font-bold tracking-[-0.025em]" />
          <p className="text-[13px] text-on-surface-variant">
            {Math.round(share * 100)}% dari semua {category.kind === "expense" ? "pengeluaran" : "pemasukan"} ·{" "}
            {delta === null ? (
              "—"
            ) : (
              <span className={(category.kind === "expense" ? delta <= 0 : delta >= 0) ? "text-positive" : "text-negative"}>
                {delta >= 0 ? "↑" : "↓"} {Math.abs(Math.round(delta * 100))}%
              </span>
            )}{" "}
            vs bulan lalu
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
            <a href={`#tx-${biggest.id}`} className="block">
              <Money value={biggest.amount} className="block text-[24px] font-bold tracking-[-0.02em]" />
              <p className="truncate text-[13px] text-primary">{biggest.note || wibDate(biggest.occurred_at)}</p>
            </a>
          ) : (
            <p className="text-[24px] font-bold">—</p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3 px-1">
          <h2 className="text-[20px] font-bold tracking-[-0.01em]">{grouping === "mingguan" ? "Per Minggu" : "Per Hari"}</h2>
          <div className="w-64">
            <UrlSegmented
              param="kelompok"
              value={grouping}
              options={[
                { value: "harian", label: "Harian" },
                { value: "mingguan", label: "Mingguan" },
                { value: "semua", label: "Semua" },
              ]}
            />
          </div>
        </div>
        <Card>
          {mine.length === 0 ? <EmptyState icon="bar_chart" title="Tidak ada transaksi bulan ini" /> : <DrillChart data={series} color={tone} />}
        </Card>
      </section>

      <section>
        <h2 className={h2}>Transaksi</h2>
        <div className="mb-3 grid gap-2 md:grid-cols-[1fr_200px_minmax(300px,1fr)]">
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-on-surface-variant" />
            <Input form="filter" name="q" type="search" defaultValue={filter.q} placeholder="Cari catatan" className="bg-card pl-9" />
          </div>
          <Select form="filter" name="dompet" defaultValue={filter.wallet ?? ""} aria-label="Dompet" className="bg-card">
            <option value="">Semua dompet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
          <SortControl by={by} dir={dir} />
        </div>

        {shown.length === 0 ? (
          <Card>
            <EmptyState icon="receipt_long" title="Tidak ada transaksi yang cocok" />
          </Card>
        ) : (
          <div className="space-y-5">
            {groups.map((g) => (
              <div key={g.key} id={`g-${g.key}`} className="scroll-mt-20">
                {grouping !== "semua" && (
                  <div className="mb-1.5 flex items-baseline justify-between px-1">
                    <p className="text-[13px] font-semibold text-on-surface-variant uppercase">{groupLabel(g.key)}</p>
                    <Money value={g.total} className="text-[13px] font-semibold text-on-surface-variant" />
                  </div>
                )}
                <TxList>
                  {g.items.map((t, i) => (
                    <FadeIn key={t.id} index={i}>
                      <div id={`tx-${t.id}`} className="scroll-mt-24">
                        <TxRow
                          tx={t}
                          walletName={walletName}
                          showDate={grouping !== "harian"}
                          actions={<TxActions tx={t} allWallets={wallets} categories={categories} />}
                        />
                      </div>
                    </FadeIn>
                  ))}
                </TxList>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
