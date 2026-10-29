"use client";

import { LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Confirm";
import { Icon } from "@/components/ui/Icon";
import { setWalletArchived } from "@/lib/actions/wallets";
import { FadeIn } from "@/components/ui/FadeIn";
import { Money } from "@/components/ui/Money";
import { WALLET_TYPE_LABEL, type Wallet, type WalletType } from "@/lib/types";
import { WALLET_ICON } from "./style";
import { CARD_H, WalletFace } from "./WalletFace";
import { WalletDialog } from "./WalletForm";

const STRIP = 66; // visible top strip of a stacked card (icon, name, balance)

export function RestoreButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="tonal" size="sm" disabled={pending} onClick={() => start(() => void setWalletArchived(id, false))}>
      Pulihkan
    </Button>
  );
}

function SelectedActions({ wallet }: { wallet: Wallet }) {
  const [pending, start] = useTransition();
  const [confirm, dialog] = useConfirm();
  return (
    <div className="-mr-1 -mb-1 flex">
      <Link
        href={`/analitik?dompet=${wallet.id}`}
        aria-label={`Lihat transaksi ${wallet.name}`}
        title="Lihat transaksi di Analitik"
        className="inline-flex size-9 items-center justify-center rounded-full hover:bg-white/15"
      >
        <Icon name="receipt_long" className="text-[18px]" />
      </Link>
      <WalletDialog wallet={wallet} label={`Ubah ${wallet.name}`} variant="icon">
        <Icon name="edit" className="text-[18px]" />
      </WalletDialog>
      {dialog}
      <IconButton
        disabled={pending}
        onClick={async () => {
          const ok = await confirm({
            title: `Arsipkan ${wallet.name}?`,
            message: "Dompet disembunyikan dari pilihan dan total saldo. Riwayat transaksinya tetap tersimpan dan bisa dipulihkan kapan saja.",
            confirmLabel: "Arsipkan",
          });
          if (ok) start(() => void setWalletArchived(wallet.id, true));
        }}
        aria-label={`Arsipkan ${wallet.name}`}
        tone="inherit"
      >
        <Icon name="archive" className="text-[18px]" />
      </IconButton>
    </div>
  );
}

const TYPE_ORDER: WalletType[] = ["bank", "ewallet", "credit", "cash", "other"];

/** One Apple Wallet–style stack per wallet type, laid out left→right (scrolls sideways when they don't fit). */
export function WalletStacks({ wallets }: { wallets: Wallet[] }) {
  const columns = TYPE_ORDER.map((type) => ({ type, items: wallets.filter((w) => w.type === type) })).filter((c) => c.items.length);
  return (
    <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 items-start gap-5 overflow-x-auto px-4 pb-4 md:-mx-1 md:px-1 [scrollbar-width:thin]">
      {columns.map((c, i) => (
        <FadeIn key={c.type} index={i} className="w-[min(300px,82vw)] shrink-0 snap-start">
          <TypeStack type={c.type} wallets={c.items} />
        </FadeIn>
      ))}
    </div>
  );
}

/**
 * The front card sits whole; the rest tuck behind it showing their header strip. Choosing one moves it
 * to the front of this stack with a layout spring. Selection is local to the stack (pure UI, no request).
 */
function TypeStack({ type, wallets }: { type: WalletType; wallets: Wallet[] }) {
  const [selectedId, setSelectedId] = useState(wallets[0].id);
  const selected = wallets.find((w) => w.id === selectedId) ?? wallets[0];
  const rest = wallets.filter((w) => w.id !== selected.id);
  const subtotal = wallets.reduce((s, w) => s + w.balance, 0);

  return (
    <section aria-label={WALLET_TYPE_LABEL[type]}>
      <div className="mb-2.5 flex items-baseline justify-between px-1">
        <h2 className="flex items-center gap-1.5 text-[17px] font-semibold">
          <Icon name={WALLET_ICON[type]} className="text-[18px] text-on-surface-variant" />
          {WALLET_TYPE_LABEL[type]}
          <span className="text-[13px] font-normal text-on-surface-variant tabular-nums">{wallets.length}</span>
        </h2>
        <Money value={subtotal} className="text-[15px] font-semibold text-on-surface-variant" />
      </div>
      <LayoutGroup id={`stack-${type}`}>
        <motion.div layout layoutId={`card-${selected.id}`} className="relative z-10">
          <WalletFace wallet={selected} actions={<SelectedActions wallet={selected} />} />
        </motion.div>
        {rest.length > 0 && (
          <div className="mt-3">
            {rest.map((w, i) => (
              <motion.div
                key={w.id}
                layout
                layoutId={`card-${w.id}`}
                role="button"
                tabIndex={0}
                aria-label={`Pilih dompet ${w.name}`}
                onClick={() => setSelectedId(w.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelectedId(w.id))}
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
      </LayoutGroup>
    </section>
  );
}
