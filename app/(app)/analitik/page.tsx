import type { Metadata } from "next";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { PeriodProvider } from "@/components/analytics/Period";
import { getT } from "@/lib/i18n-server";
import { isoRange, periodFromParams } from "@/lib/period";
import { getCategories, getTransactionsBetween, getWallets } from "@/lib/queries";
import { todayWib, wibDate } from "@/lib/reports";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Analitik · TaMoney" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Server: fetch one period (+ the previous one for comparison). Filtering/sorting happen in AnalyticsView. */
export default async function AnalitikPage({ searchParams }: PageProps<"/analitik">) {
  const sp = await searchParams;
  const today = todayWib();
  const period = periodFromParams(sp, today);
  const { start, end } = isoRange(period.prev.start, period.end);

  const { supabase } = await requireUser();
  const [wallets, categories, txs, t] = await Promise.all([
    getWallets(supabase, true),
    getCategories(supabase),
    getTransactionsBetween(supabase, start, end),
    getT(),
  ]);
  const inPeriod = (t: (typeof txs)[number]) => wibDate(t.occurred_at) >= period.start;

  return (
    <div className="space-y-6">
      <h1 className="large-title px-1">{t("Analitik")}</h1>
      <PeriodProvider>
        <AnalyticsView
          key={`${period.start}_${period.end}`}
          rows={txs.filter(inPeriod)}
          prevRows={txs.filter((t) => !inPeriod(t))}
          wallets={wallets}
          categories={categories}
          period={period}
          today={today}
          initial={{ q: one(sp.q), kategori: one(sp.kategori), dompet: one(sp.dompet), jenis: one(sp.jenis), urut: one(sp.urut), arah: one(sp.arah) }}
        />
      </PeriodProvider>
    </div>
  );
}
