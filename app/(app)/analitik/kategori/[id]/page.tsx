import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/analytics/CategoryView";
import { PeriodProvider } from "@/components/analytics/Period";
import { isoRange, periodFromParams } from "@/lib/period";
import { getCategories, getTransactionsBetween, getWallets } from "@/lib/queries";
import { todayWib, wibDate, monthTotals } from "@/lib/reports";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Kategori · Analitik · TaMoney" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Server: the period's rows (+ previous period) for one category. Grouping/sort/filter run in CategoryView. */
export default async function KategoriPage({ params, searchParams }: PageProps<"/analitik/kategori/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const today = todayWib();
  const period = periodFromParams(sp, today);
  const { start, end } = isoRange(period.prev.start, period.end);

  const { supabase } = await requireUser();
  const [categories, wallets, txs] = await Promise.all([getCategories(supabase), getWallets(supabase, true), getTransactionsBetween(supabase, start, end)]);
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const inPeriod = (t: (typeof txs)[number]) => wibDate(t.occurred_at) >= period.start;
  const current = txs.filter(inPeriod);

  return (
    <PeriodProvider>
      <CategoryView
        key={`${period.start}_${period.end}`}
        category={category}
        rows={current.filter((t) => t.category_id === id)}
        prevRows={txs.filter((t) => !inPeriod(t) && t.category_id === id)}
        kindTotal={category.kind === "expense" ? monthTotals(current).expense : monthTotals(current).income}
        wallets={wallets}
        categories={categories}
        period={period}
        today={today}
        initial={{ q: one(sp.q), kategori: "", dompet: one(sp.dompet), jenis: "", urut: one(sp.urut), arah: one(sp.arah), kelompok: one(sp.kelompok) }}
      />
    </PeriodProvider>
  );
}
