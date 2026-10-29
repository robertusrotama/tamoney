import type { Metadata } from "next";
import { TxList, TxRow } from "@/components/transactions/TxRow";
import { Card, EmptyState, Label } from "@/components/ui/EmptyState";
import { FadeIn } from "@/components/ui/FadeIn";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { TransferForm } from "@/components/wallets/TransferForm";
import { RestoreButton, WalletCard } from "@/components/wallets/WalletCard";
import { WalletDialog } from "@/components/wallets/WalletForm";
import { WALLET_ICON } from "@/components/wallets/style";
import { getRecentTransfers, getWallets } from "@/lib/queries";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dompet · TaMoney" };

export default async function DompetPage() {
  const { supabase } = await requireUser();
  const [all, transfers] = await Promise.all([getWallets(supabase, { includeArchived: true }), getRecentTransfers(supabase)]);
  const active = all.filter((w) => !w.archived_at);
  const archived = all.filter((w) => w.archived_at);
  const total = active.reduce((s, w) => s + w.balance, 0);
  const names = new Map(all.map((w) => [w.id, w.name]));
  const walletName = (id: string) => names.get(id) ?? "—";

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 px-1">
        <div>
          <h1 className="large-title">Dompet</h1>
          <p className="text-[15px] text-on-surface-variant">
            {active.length} aktif · total <Money value={total} className="font-semibold text-on-surface" />
          </p>
        </div>
        <WalletDialog variant="tonal">
          <Icon name="add" className="text-[18px]" /> Tambah
        </WalletDialog>
      </div>

      {active.length === 0 ? (
        <Card>
          <EmptyState icon="account_balance_wallet" title="Belum ada dompet">
            <p className="text-[15px]">Buat dompet pertama: tunai, rekening bank, atau e-wallet.</p>
          </EmptyState>
        </Card>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((w, i) => (
            <FadeIn key={w.id} index={i}>
              <WalletCard wallet={w} />
            </FadeIn>
          ))}
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section className="min-w-0">
          <h2 className="mb-2 px-1 text-[20px] font-bold tracking-[-0.01em]">Riwayat Transfer</h2>
          {transfers.length === 0 ? (
            <Card>
              <EmptyState icon="swap_horiz" title="Belum ada transfer" />
            </Card>
          ) : (
            <TxList>
              {transfers.map((t, i) => (
                <FadeIn key={t.id} index={i}>
                  <TxRow tx={t} walletName={walletName} showDate />
                </FadeIn>
              ))}
            </TxList>
          )}
        </section>

        <section>
          <h2 className="mb-2 px-1 text-[20px] font-bold tracking-[-0.01em]">Pindah Saldo</h2>
          <Card className="p-5">
            {active.length < 2 ? (
              <p className="text-[15px] text-on-surface-variant">Butuh minimal 2 dompet aktif untuk transfer.</p>
            ) : (
              <TransferForm wallets={active} />
            )}
          </Card>
        </section>
      </div>

      {archived.length > 0 && (
        <section>
          <h2 className="mb-1 px-1 text-[20px] font-bold tracking-[-0.01em]">Diarsipkan</h2>
          <Label className="mb-2 px-1">Tidak muncul di pilihan dan total saldo. Riwayatnya tetap tersimpan.</Label>
          <div className="overflow-hidden rounded-[14px] bg-card">
            {archived.map((w) => (
              <div key={w.id} className="flex items-center gap-3 border-b border-outline px-4 py-2.5 last:border-0">
                <span className="flex size-8 items-center justify-center rounded-[8px] bg-surface-dim text-on-surface-variant">
                  <Icon name={WALLET_ICON[w.type]} className="text-[19px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px]">{w.name}</p>
                  <p className="text-[13px] text-on-surface-variant">
                    Saldo terakhir <Money value={w.balance} />
                  </p>
                </div>
                <RestoreButton id={w.id} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
