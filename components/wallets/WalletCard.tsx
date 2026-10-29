"use client";

import { motion } from "motion/react";
import { useTransition } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { setWalletArchived } from "@/lib/actions/wallets";
import { WALLET_TYPE_LABEL, type Wallet } from "@/lib/types";
import { WALLET_GRADIENT, WALLET_ICON } from "./style";
import { WalletDialog } from "./WalletForm";

export function RestoreButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="tonal" disabled={pending} onClick={() => start(() => void setWalletArchived(id, false))} className="min-h-8 px-3.5 text-[13px]">
      Pulihkan
    </Button>
  );
}

export function WalletCard({ wallet }: { wallet: Wallet }) {
  const [pending, start] = useTransition();
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative flex aspect-[1.586] flex-col justify-between overflow-hidden rounded-[18px] bg-gradient-to-br p-4 text-white shadow-[0_12px_28px_-12px_rgb(0_0_0/0.45)] ${WALLET_GRADIENT[wallet.type]}`}
    >
      {/* light catching the top edge of the card */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[18px] bg-gradient-to-b from-white/20 to-transparent to-40%" />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon name={WALLET_ICON[wallet.type]} className="text-[22px]" filled />
          <div>
            <p className="text-[17px] font-semibold leading-tight">{wallet.name}</p>
            <p className="text-[12px] text-white/75">{WALLET_TYPE_LABEL[wallet.type]}</p>
          </div>
        </div>
        <div className="-mt-1 -mr-1 flex">
          <WalletDialog wallet={wallet} label={`Ubah ${wallet.name}`} variant="icon">
            <Icon name="edit" className="text-[18px]" />
          </WalletDialog>
          <IconButton
            disabled={pending}
            onClick={() =>
              confirm(`Arsipkan ${wallet.name}? Dompet disembunyikan dari pilihan; riwayatnya tetap tersimpan.`) &&
              start(() => void setWalletArchived(wallet.id, true))
            }
            aria-label={`Arsipkan ${wallet.name}`}
            className="text-current hover:bg-white/15"
          >
            <Icon name="archive" className="text-[18px]" />
          </IconButton>
        </div>
      </div>
      <div className="relative">
        <p className="text-[12px] text-white/75">Saldo</p>
        <Money value={wallet.balance} className="text-[26px] font-bold tracking-[-0.02em]" />
      </div>
    </motion.div>
  );
}
