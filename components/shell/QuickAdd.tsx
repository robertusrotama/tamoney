"use client";

import { useCallback, useState } from "react";
import { TxForm } from "@/components/transactions/TxForm";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import type { Category, Wallet } from "@/lib/types";

/** "Catat Transaksi" in the top bar (desktop) and a floating + (mobile), both opening the same form. */
export function QuickAdd({ wallets, categories }: { wallets: Wallet[]; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="hidden md:inline-flex">
        <Icon name="add" className="text-lg" /> Catat Transaksi
      </Button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Catat transaksi"
        className="fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-xl active:scale-95 md:hidden"
      >
        <Icon name="add" className="text-3xl" />
      </button>
      <Dialog open={open} onClose={close} title="Catat Transaksi">
        <TxForm wallets={wallets} categories={categories} onDone={close} />
      </Dialog>
    </>
  );
}
