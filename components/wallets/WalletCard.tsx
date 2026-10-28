"use client";

import { useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { setWalletArchived } from "@/lib/actions/wallets";
import { WALLET_TYPE_LABEL, type Wallet } from "@/lib/types";
import { WalletDialog } from "./WalletForm";

export const WALLET_ICON = { cash: "payments", bank: "account_balance", ewallet: "smartphone", other: "wallet" } as const;

export function RestoreButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void setWalletArchived(id, false))}
      className="inline-flex items-center gap-1 rounded-full bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-container disabled:opacity-60"
    >
      <Icon name="unarchive" className="text-lg" /> Pulihkan
    </button>
  );
}

export function WalletCard({ wallet, featured }: { wallet: Wallet; featured?: boolean }) {
  const [pending, start] = useTransition();
  const tone = featured ? "bg-primary text-on-primary border-primary" : "bg-card border-outline-variant";
  const muted = featured ? "text-on-primary/70" : "text-on-surface-variant";

  return (
    <div className={`flex flex-col justify-between gap-6 rounded-2xl border p-5 shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className={`flex size-10 items-center justify-center rounded-xl ${featured ? "bg-white/15" : "bg-primary-container text-primary"}`}>
            <Icon name={WALLET_ICON[wallet.type]} />
          </span>
          <div>
            <p className="font-semibold">{wallet.name}</p>
            <p className={`font-mono text-[11px] uppercase ${muted}`}>{WALLET_TYPE_LABEL[wallet.type]}</p>
          </div>
        </div>
        <div className="flex">
          <WalletDialog wallet={wallet} label={`Ubah ${wallet.name}`}>
            <Icon name="edit" className="text-lg" />
          </WalletDialog>
          <button
            type="button"
            disabled={pending}
            onClick={() => confirm(`Arsipkan ${wallet.name}? Dompet tidak muncul lagi di pilihan, riwayatnya tetap tersimpan.`) && start(() => void setWalletArchived(wallet.id, true))}
            aria-label={`Arsipkan ${wallet.name}`}
            className="rounded-full p-1.5 hover:bg-black/5"
          >
            <Icon name="archive" className="text-lg" />
          </button>
        </div>
      </div>
      <div>
        <p className={`font-mono text-[11px] uppercase ${muted}`}>Saldo tersedia</p>
        <Money value={wallet.balance} className="text-2xl font-bold" />
      </div>
    </div>
  );
}
