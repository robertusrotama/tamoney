import type { Metadata } from "next";
import { Card, EmptyState, Label } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { TransferForm } from "@/components/wallets/TransferForm";
import { RestoreButton, WALLET_ICON, WalletCard } from "@/components/wallets/WalletCard";
import { WalletDialog } from "@/components/wallets/WalletForm";
import { getRecentTransfers, getWallets } from "@/lib/queries";
import { wibDate } from "@/lib/reports";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Kelola Dompet · TaMoney" };

export default async function DompetPage() {
  const { supabase } = await requireUser();
  const [all, transfers] = await Promise.all([getWallets(supabase, { includeArchived: true }), getRecentTransfers(supabase)]);
  const active = all.filter((w) => !w.archived_at);
  const archived = all.filter((w) => w.archived_at);
  const total = active.reduce((s, w) => s + w.balance, 0);
  const name = new Map(all.map((w) => [w.id, w.name]));

  const addButton = (
    <WalletDialog>
      <Icon name="add_circle" className="text-lg" /> Tambah Dompet
    </WalletDialog>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Kelola Dompet</h1>
          <p className="text-sm text-on-surface-variant">Pantau saldo tiap dompet, tambah dompet baru, dan pindahkan saldo antar dompet.</p>
        </div>
        {addButton}
      </div>

      <Card className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <div>
          <Label>Total saldo dompet aktif</Label>
          <Money value={total} className="text-3xl font-bold md:text-4xl" />
        </div>
        <div className="rounded-xl bg-surface-dim px-4 py-3">
          <Label>Dompet aktif</Label>
          <p className="text-2xl font-bold">{active.length}</p>
        </div>
        <div className="rounded-xl bg-surface-dim px-4 py-3">
          <Label>Diarsipkan</Label>
          <p className="text-2xl font-bold">{archived.length}</p>
        </div>
      </Card>

      {active.length === 0 ? (
        <Card>
          <EmptyState icon="account_balance_wallet" title="Belum ada dompet">
            <p className="text-sm">Buat dompet pertama, misalnya Tunai, rekening bank, atau e-wallet.</p>
            <div className="mt-2">{addButton}</div>
          </EmptyState>
        </Card>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((w, i) => (
            <WalletCard key={w.id} wallet={w} featured={i === 0} />
          ))}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Riwayat Transfer</h2>
          {transfers.length === 0 ? (
            <EmptyState icon="swap_horiz" title="Belum ada transfer" />
          ) : (
            <ul className="divide-y divide-outline-variant">
              {transfers.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tertiary-container text-tertiary">
                      <Icon name="swap_horiz" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {name.get(t.wallet_id)} → {t.to_wallet_id && name.get(t.to_wallet_id)}
                      </p>
                      <p className="truncate text-xs text-on-surface-variant">
                        {wibDate(t.occurred_at)}
                        {t.note && ` · ${t.note}`}
                      </p>
                    </div>
                  </div>
                  <Money value={t.amount} className="shrink-0 text-sm font-semibold" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Icon name="bolt" className="text-tertiary" /> Transfer Antar Dompet
          </h2>
          {active.length < 2 ? (
            <p className="text-sm text-on-surface-variant">Butuh minimal 2 dompet aktif untuk transfer.</p>
          ) : (
            <TransferForm wallets={active} />
          )}
        </Card>
      </div>

      {archived.length > 0 && (
        <Card>
          <h2 className="mb-1 text-lg font-bold">Dompet Diarsipkan</h2>
          <p className="mb-4 text-sm text-on-surface-variant">Tidak muncul di pilihan dan total saldo. Riwayat transaksinya tetap tersimpan.</p>
          <ul className="space-y-2">
            {archived.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-dim px-4 py-3">
                <div className="flex items-center gap-3">
                  <Icon name={WALLET_ICON[w.type]} className="text-on-surface-variant" />
                  <div>
                    <p className="font-semibold">{w.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      Saldo terakhir <Money value={w.balance} />
                    </p>
                  </div>
                </div>
                <RestoreButton id={w.id} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
