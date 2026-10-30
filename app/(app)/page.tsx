import Link from "next/link";
import { PlanCards } from "@/components/dashboard/PlanCards";
import { TxForm } from "@/components/transactions/TxForm";
import { TxList, TxRow } from "@/components/transactions/TxRow";
import { Card, EmptyState, Label } from "@/components/ui/EmptyState";
import { FadeIn } from "@/components/ui/FadeIn";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { WalletDialog } from "@/components/wallets/WalletForm";
import { monthLabel } from "@/lib/budget";
import { getPlanningState } from "@/lib/planning";
import { getCategories, getProfile, getTransactionsBetween, getWallets } from "@/lib/queries";
import { monthKey, monthRange, monthTotals, todayWib, wibDate, wibGreeting } from "@/lib/reports";
import { getLang } from "@/lib/i18n-server";
import { localeOf, makeT } from "@/lib/i18n";
import { requireUser } from "@/lib/supabase/server";

const longDate = (d: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(d));

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between px-1">
      <h2 className="text-[20px] font-bold tracking-[-0.01em]">{title}</h2>
      {href && (
        <Link href={href} className="text-[15px] text-primary">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const lang = await getLang();
  const t = makeT(lang);
  const today = todayWib();
  const { start, end } = monthRange(monthKey(new Date().toISOString()));
  const [wallets, categories, monthTxs, plan, profile] = await Promise.all([
    getWallets(supabase),
    getCategories(supabase),
    getTransactionsBetween(supabase, start, end),
    getPlanningState(supabase),
    getProfile(supabase, user.email),
  ]);

  const { income, expense } = monthTotals(monthTxs);
  const todayTxs = monthTxs.filter((t) => wibDate(t.occurred_at) === today);
  const expensesToday = todayTxs.filter((t) => t.kind === "expense");
  const spentToday = monthTotals(todayTxs).expense; // net of friends' paybacks
  const names = new Map(wallets.map((w) => [w.id, w.name]));
  const walletName = (id: string) => names.get(id) ?? t("Diarsipkan");
  const firstName = profile.display_name.split(" ")[0];
  const spentShare = income > 0 ? Math.min(expense / income, 1) : expense > 0 ? 1 : 0;

  return (
    <div className="space-y-8">
      <div className="px-1">
        <p className="text-[13px] font-semibold text-on-surface-variant uppercase">{longDate(today, localeOf(lang))}</p>
        <h1 className="large-title">
          {wibGreeting(new Date(), t)}, {firstName}
        </h1>
      </div>

      {wallets.length === 0 ? (
        <Card>
          <EmptyState icon="account_balance_wallet" title={t("Buat dompet pertama")}>
            <p className="max-w-xs text-[15px]">{t("Tambahkan tunai, rekening bank, atau e-wallet untuk mulai mencatat.")}</p>
            <div className="mt-3">
              <WalletDialog>
                <Icon name="add" className="text-[18px]" /> {t("Tambah Dompet")}
              </WalletDialog>
            </div>
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-8">
            {/* Hero: what went out today, then this month's flow */}
            <Card className="p-5">
              <Label>{t("Pengeluaran hari ini")}</Label>
              <Money value={spentToday} className="mt-0.5 block text-[clamp(2.25rem,1.6rem+3vw,3rem)] leading-none font-bold tracking-[-0.03em]" />
              <p className="mt-1 text-[13px] text-on-surface-variant">
                {expensesToday.length ? t("dari {n} transaksi", { n: expensesToday.length }) : t("Belum ada pengeluaran hari ini")}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="flex items-center gap-1 text-[13px] text-on-surface-variant">
                    <Icon name="south_west" className="text-[15px] text-positive" /> {t("Masuk bulan ini")}
                  </p>
                  <Money value={income} className="text-[20px] font-semibold tracking-[-0.01em]" />
                </div>
                <div>
                  <p className="flex items-center gap-1 text-[13px] text-on-surface-variant">
                    <Icon name="north_east" className="text-[15px] text-negative" /> {t("Keluar bulan ini")}
                  </p>
                  <Money value={expense} className="text-[20px] font-semibold tracking-[-0.01em]" />
                </div>
              </div>
              <div
                className="mt-4 h-1.5 overflow-hidden rounded-full bg-positive/25"
                role="img"
                aria-label={t("Pengeluaran {pct}% dari pemasukan", { pct: Math.round(spentShare * 100) })}
              >
                <div className="h-full rounded-full bg-negative" style={{ width: `${spentShare * 100}%` }} />
              </div>
            </Card>

            <PlanCards s={plan} wallets={wallets} />

            <section>
              <SectionHeader title={t("Hari Ini")} href="/analitik" linkLabel={t("Semua")} />
              {todayTxs.length === 0 ? (
                <Card>
                  <EmptyState icon="receipt_long" title={t("Belum ada transaksi hari ini")}>
                    <p className="text-[15px]">{t("Ketuk + untuk mencatat.")}</p>
                  </EmptyState>
                </Card>
              ) : (
                <TxList>
                  {todayTxs.map((t, i) => (
                    <FadeIn key={t.id} index={i}>
                      <TxRow tx={t} walletName={walletName} />
                    </FadeIn>
                  ))}
                </TxList>
              )}
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <SectionHeader title={t("Catat Cepat")} />
              <Card className="p-5">
                <TxForm
                  wallets={wallets}
                  categories={categories}
                  budgetPeriod={plan.current ? { id: plan.current.period.id, label: monthLabel(plan.current.period.month, localeOf(lang)) } : undefined}
                />
              </Card>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
