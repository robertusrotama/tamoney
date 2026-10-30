import type { Metadata } from "next";
import { Card, EmptyState, Label } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { BalanceEye } from "@/components/ui/Privacy";
import { RestoreButton, WalletStacks } from "@/components/wallets/WalletCard";
import { WalletDialog } from "@/components/wallets/WalletForm";
import { WALLET_ICON } from "@/components/wallets/style";
import { getWallets } from "@/lib/queries";
import { getT } from "@/lib/i18n-server";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dompet · TaMoney" };

export default async function DompetPage() {
  const { supabase } = await requireUser();
  const [all, t] = await Promise.all([getWallets(supabase, true), getT()]);
  const active = all.filter((w) => !w.archived_at);
  const archived = all.filter((w) => w.archived_at);
  const total = active.reduce((s, w) => s + w.balance, 0);
  const h2 = "text-[20px] font-bold tracking-[-0.01em]";

  return (
    <div className="dot-grid -mx-4 -mt-2 min-h-[calc(100dvh-4rem)] space-y-10 px-4 pt-2 pb-10 md:-mx-2 md:px-2">
      <div className="space-y-3 px-1">
        <div className="flex items-center justify-between gap-4">
          <h1 className="large-title">{t("Dompet")}</h1>
          <WalletDialog variant="tonal">
            <Icon name="add" className="text-[18px]" /> {t("Tambah")}
          </WalletDialog>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[13px] font-semibold tracking-[0.04em] text-on-surface-variant uppercase">
            {t("Saldo total")} <BalanceEye className="-my-2" />
          </p>
          <Money value={total} sensitive className="block text-[clamp(2.25rem,1.6rem+3vw,3rem)] leading-none font-bold tracking-[-0.03em] whitespace-nowrap" />
          <p className="mt-1 text-[15px] text-on-surface-variant">{t("dari {n} dompet aktif", { n: active.length })}</p>
        </div>
      </div>

      {active.length === 0 ? (
        <Card>
          <EmptyState icon="account_balance_wallet" title={t("Belum ada dompet")}>
            <p className="text-[15px]">{t("Buat dompet pertama: tunai, rekening bank, e-wallet, atau kartu kredit.")}</p>
          </EmptyState>
        </Card>
      ) : (
        <WalletStacks wallets={active} />
      )}

      {archived.length > 0 && (
        <section>
          <h2 className={`mb-1 px-1 ${h2}`}>{t("Diarsipkan")}</h2>
          <Label className="mb-2 px-1">{t("Tidak muncul di pilihan dan total saldo. Riwayatnya tetap tersimpan.")}</Label>
          <div className="overflow-hidden rounded-[14px] bg-card">
            {archived.map((w) => (
              <div key={w.id} className="flex items-center gap-3 border-b border-outline px-4 py-2.5 last:border-0">
                <span className="flex size-8 items-center justify-center rounded-[8px] bg-surface-dim text-on-surface-variant">
                  <Icon name={WALLET_ICON[w.type]} className="text-[19px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px]">{w.name}</p>
                  <p className="text-[13px] text-on-surface-variant">
                    {t("Saldo terakhir")} <Money value={w.balance} />
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
