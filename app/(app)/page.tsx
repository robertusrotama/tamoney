import Link from "next/link";
import { TxForm } from "@/components/transactions/TxForm";
import { TxRow } from "@/components/transactions/TxRow";
import { Card, EmptyState, Label } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { WalletDialog } from "@/components/wallets/WalletForm";
import { getCategories, getTransactionsBetween, getWallets } from "@/lib/queries";
import { monthKey, monthRange, monthTotals, todayWib, wibDate, wibGreeting } from "@/lib/reports";
import { requireUser } from "@/lib/supabase/server";

const longDate = (d: string) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(d));

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

  return (
    <div className="space-y-8">
      <div>
        <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
          <Icon name="calendar_today" className="text-sm" /> {longDate(today)}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
          {wibGreeting()}, {firstName}!
        </h1>
      </div>

      {wallets.length === 0 ? (
        <Card>
          <EmptyState icon="account_balance_wallet" title="Buat dompet pertama">
            <p className="max-w-sm text-sm">Tambahkan dompet (tunai, rekening bank, atau e-wallet) untuk mulai mencatat transaksi.</p>
            <div className="mt-2">
              <WalletDialog>
                <Icon name="add_circle" className="text-lg" /> Tambah Dompet
              </WalletDialog>
            </div>
          </EmptyState>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Card>
              <Label>Saldo total</Label>
              <Money value={total} className="mt-2 block text-3xl font-bold" />
            </Card>
            <Card>
              <Label className="flex items-center justify-between">
                Pemasukan bulan ini <Icon name="arrow_downward" className="rounded-full bg-positive-container p-1 text-base text-positive" />
              </Label>
              <Money value={income} className="mt-2 block text-3xl font-bold text-positive" />
            </Card>
            <Card>
              <Label className="flex items-center justify-between">
                Pengeluaran bulan ini <Icon name="arrow_upward" className="rounded-full bg-negative-container p-1 text-base text-negative" />
              </Label>
              <Money value={expense} className="mt-2 block text-3xl font-bold text-negative" />
            </Card>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="min-w-0 space-y-6">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <Icon name="account_balance_wallet" /> Dompet
                  </h2>
                  <Link href="/dompet" className="font-mono text-xs font-semibold text-primary hover:underline">
                    Kelola Semua ›
                  </Link>
                </div>
                <div className="flex snap-x gap-3 overflow-x-auto pb-2">
                  {wallets.map((w, i) => (
                    <div
                      key={w.id}
                      className={`min-w-44 snap-start rounded-2xl border p-4 ${i === 0 ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-card"}`}
                    >
                      <p className="truncate text-sm font-semibold">{w.name}</p>
                      <Money value={w.balance} className="mt-3 block text-lg font-bold" />
                    </div>
                  ))}
                </div>
              </section>

              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <Icon name="history" /> Aktivitas Hari Ini
                    <span className="rounded-full bg-surface-dim px-2 py-0.5 font-mono text-[11px] font-medium text-on-surface-variant">
                      {todayTxs.length} transaksi
                    </span>
                  </h2>
                  <Link href="/analitik" className="text-sm font-semibold text-primary hover:underline">
                    Lihat Semua
                  </Link>
                </div>
                {todayTxs.length === 0 ? (
                  <EmptyState icon="receipt_long" title="Belum ada transaksi hari ini" />
                ) : (
                  <div className="space-y-2">
                    {todayTxs.map((t) => (
                      <TxRow key={t.id} tx={t} walletName={walletName} />
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <Card className="hidden h-fit xl:block">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <Icon name="bolt" className="text-primary" /> Catat Singkat
              </h2>
              <TxForm wallets={wallets} categories={categories} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
