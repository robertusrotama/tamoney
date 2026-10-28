"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";

/** "Catat Transaksi" in the top bar (desktop) and a floating + (mobile), both opening the same form. */
export function QuickAdd() {
  const [open, setOpen] = useState(false);
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
      <Dialog open={open} onClose={() => setOpen(false)} title="Catat Transaksi">
        <p className="text-sm text-on-surface-variant">Segera.</p>
      </Dialog>
    </>
  );
}
