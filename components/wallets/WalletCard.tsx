"use client";

import { motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { setWalletArchived } from "@/lib/actions/wallets";
import type { Wallet } from "@/lib/types";
import { CARD_H, WalletFace } from "./WalletFace";
import { WalletDialog } from "./WalletForm";

const STRIP = 66; // visible top strip of a stacked card (icon, name, balance)

export function RestoreButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="tonal" disabled={pending} onClick={() => start(() => void setWalletArchived(id, false))} className="min-h-8 px-3.5 text-[13px]">
      Pulihkan
    </Button>
  );
}

function SelectedActions({ wallet }: { wallet: Wallet }) {
  const [pending, start] = useTransition();
  return (
    <div className="-mr-1 -mb-1 flex">
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
  );
}

/**
 * Apple Wallet stack: the selected card sits whole at the front, the rest tuck behind showing only their
 * header strip. Choosing a card moves it to the front with a layout spring; selection lives in ?dompet=.
 */
export function WalletStack({ wallets, selectedId }: { wallets: Wallet[]; selectedId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = wallets.find((w) => w.id === selectedId) ?? wallets[0];
  const rest = wallets.filter((w) => w.id !== selected.id);

  const choose = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("dompet", id);
    router.push(`${pathname}?${next}`, { scroll: false });
  };

  return (
    <div>
      <motion.div layout layoutId={`card-${selected.id}`} className="relative z-10">
        <WalletFace wallet={selected} actions={<SelectedActions wallet={selected} />} />
      </motion.div>
      {rest.length > 0 && (
        <div className="mt-3" style={{ paddingBottom: 0 }}>
          {rest.map((w, i) => (
            <motion.div
              key={w.id}
              layout
              layoutId={`card-${w.id}`}
              role="button"
              tabIndex={0}
              aria-label={`Pilih dompet ${w.name}`}
              onClick={() => choose(w.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), choose(w.id))}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.985 }}
              style={{ marginTop: i === 0 ? 0 : STRIP - CARD_H, zIndex: i + 1 }}
              className="relative cursor-pointer rounded-[16px] outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <WalletFace wallet={w} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
