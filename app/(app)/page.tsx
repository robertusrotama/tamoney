import Link from "next/link";
import { TxForm } from "@/components/transactions/TxForm";
import { TxList, TxRow } from "@/components/transactions/TxRow";
import { Card, EmptyState, Label } from "@/components/ui/EmptyState";
import { FadeIn } from "@/components/ui/FadeIn";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { WALLET_ICON, cardInk, cardStyle } from "@/components/wallets/style";
import { WalletDialog } from "@/components/wallets/WalletForm";
import { getCategories, getTransactionsBetween, getWallets } from "@/lib/queries";
import { monthKey, monthRange, monthTotals, todayWib, wibDate, wibGreeting } from "@/lib/reports";
import { requireUser } from "@/lib/supabase/server";

const longDate = (d: string) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(d));

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
  const today = todayWib();
  const { start, end } = monthRange(monthKey(new Date().toISOString()));
  const [wallets, categories, monthTxs] = await Promise.all([
    getWallets(supabase),
    getCategories(supabase),
    getTransactionsBetween(supabase, start, end),
  ]);

  const total = wallets.reduce((s, w) => s + w.balance, 0);
  const { income, expense } = monthTotals(monthTxs);
  const todayTxs = monthTxs.filter((t) => wibDate(t.occurred_at) === today);
  const names = new Map(wallets.map((w) => [w.id, w.name]));
  const walletName = (id: string) => names.get(id) ?? "Diarsipkan";
  const firstName = ((user.user_metadata.display_name as string | undefined) || user.email!.split("@")[0]).split(" ")[0];
  const spentShare = income > 0 ? Math.min(expense / income, 1) : expense > 0 ? 1 : 0;

  return (
    <div className="space-y-8">
      <div className="px-1">
        <p className="text-[13px] font-semibold text-on-surface-variant uppercase">{longDate(today)}</p>
        <h1 className="large-title">
          {wibGreeting()}, {firstName}
        </h1>
      </div>

      {wallets.length === 0 ? (
        <Card>
          <EmptyState icon="account_balance_wallet" title="Buat dompet pertama">
            <p className="max-w-xs text-[15px]">Tambahkan tunai, rekening bank, atau e-wallet untuk mulai mencatat.</p>
            <div className="mt-3">
              <WalletDialog>
                <Icon name="add" className="text-[18px]" /> Tambah Dompet
              </WalletDialog>
            </div>
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-8">
            {/* Hero: the one number that matters most, then this month's flow */}
            <Card className="p-5">
              <Label>Saldo total</Label>
              <Money value={total} className="mt-0.5 block text-[clamp(2.25rem,1.6rem+3vw,3rem)] leading-none font-bold tracking-[-0.03em]" />
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="flex items-center gap-1 text-[13px] text-on-surface-variant">
                    <Icon name="south_west" className="text-[15px] text-positive" /> Masuk bulan ini
                  </p>
                  <Money value={income} className="text-[20px] font-semibold tracking-[-0.01em]" />
                </div>
                <div>
                  <p className="flex items-center gap-1 text-[13px] text-on-surface-variant">
                    <Icon name="north_east" className="text-[15px] text-negative" /> Keluar bulan ini
                  </p>
                  <Money value={expense} className="text-[20px] font-semibold tracking-[-0.01em]" />
                </div>
              </div>
              <div
                className="mt-4 h-1.5 overflow-hidden rounded-full bg-positive/25"
                role="img"
                aria-label={`Pengeluaran ${Math.round(spentShare * 100)}% dari pemasukan`}
              >
                <div className="h-full rounded-full bg-negative" style={{ width: `${spentShare * 100}%` }} />
              </div>
            </Card>

            <section>
              <SectionHeader title="Dompet" href="/dompet" linkLabel="Kelola" />
              <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 md:-mx-1 md:px-1 [scrollbar-width:none]">
                {wallets.map((w, i) => (
                  <FadeIn key={w.id} index={i} className="snap-start">
                    <Link
                      href={`/dompet?dompet=${w.id}`}
                      style={cardStyle(w)}
                      className={`flex w-40 flex-col gap-6 rounded-[14px] p-3.5 ${cardInk(w)}`}
                    >
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                        <Icon name={WALLET_ICON[w.type]} className="text-[17px]" filled />
                        <span className="truncate">{w.name}</span>
                      </span>
                      <Money value={w.balance} className="text-[17px] font-bold tracking-[-0.01em]" />
                    </Link>
                  </FadeIn>
                ))}
              </div>
            </section>

            <section>
              <SectionHeader title="Hari Ini" href="/analitik" linkLabel="Semua" />
              {todayTxs.length === 0 ? (
                <Card>
                  <EmptyState icon="receipt_long" title="Belum ada transaksi hari ini">
                    <p className="text-[15px]">Ketuk + untuk mencatat.</p>
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
              <SectionHeader title="Catat Cepat" />
              <Card className="p-5">
                <TxForm wallets={wallets} categories={categories} />
              </Card>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
