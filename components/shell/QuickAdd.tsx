"use client";

import { motion } from "motion/react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { TxForm } from "@/components/transactions/TxForm";
import { Button } from "@/components/ui/Button";
import { Dialog, useDialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import type { Category, Wallet } from "@/lib/types";

const noop = () => () => {};

/** "Catat" in the toolbar (desktop) and a floating + (mobile); the form grows out of whichever was tapped. */
export function QuickAdd({ wallets, categories }: { wallets: Wallet[]; categories: Category[] }) {
  const d = useDialog();
  const mounted = useSyncExternalStore(noop, () => true, () => false); // document.body exists only on the client
  return (
    <>
      <span className="hidden md:contents">
        <Button onClick={d.show} className="min-h-9 px-4 text-[14px]">
          <Icon name="add" className="text-[18px]" /> Catat
        </Button>
      </span>
      {/* Portaled to <body>: inside the header's glass (backdrop-filter) a fixed child is positioned
          relative to the header, which Safari pins to the top of the page. */}
      {mounted &&
        createPortal(
          <motion.button
            type="button"
            onClick={d.show}
            aria-label="Catat transaksi"
            whileTap={{ scale: 0.9 }}
            className="fixed right-5 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_8px_24px_-6px_rgb(0_122_255/0.6)] md:hidden"
          >
            <Icon name="add" className="text-[30px]" />
          </motion.button>,
          document.body,
        )}
      <Dialog open={d.open} origin={d.origin} onClose={d.close} title="Catat Transaksi">
        <TxForm wallets={wallets} categories={categories} onDone={d.close} />
      </Dialog>
    </>
  );
}
