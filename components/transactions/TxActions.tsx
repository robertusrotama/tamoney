"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FormError } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { TransferForm } from "@/components/wallets/TransferForm";
import { deleteTransaction } from "@/lib/actions/transactions";
import type { Category, Tx, Wallet } from "@/lib/types";
import { TxForm } from "./TxForm";

/** Edit + delete for one history row. allWallets includes archived ones; the form offers active + this row's own. */
export function TxActions({ tx, allWallets, categories }: { tx: Tx; allWallets: Wallet[]; categories: Category[] }) {
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const close = useCallback(() => setMode(null), []);
  const wallets = allWallets.filter((w) => !w.archived_at || w.id === tx.wallet_id || w.id === tx.to_wallet_id);

  const remove = () =>
    start(async () => {
      const res = await deleteTransaction(tx.id);
      if (res.error) setError(res.error);
      else close();
    });

  return (
    <div className="flex shrink-0">
      <button type="button" onClick={() => setMode("edit")} aria-label="Ubah transaksi" className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-dim">
        <Icon name="edit" className="text-lg" />
      </button>
      <button type="button" onClick={() => setMode("delete")} aria-label="Hapus transaksi" className="rounded-full p-1.5 text-on-surface-variant hover:bg-negative-container hover:text-negative">
        <Icon name="delete" className="text-lg" />
      </button>

      <Dialog open={mode === "edit"} onClose={close} title={tx.kind === "transfer" ? "Ubah Transfer" : "Ubah Transaksi"}>
        {tx.kind === "transfer" ? (
          <TransferForm wallets={wallets} initial={tx} onDone={close} />
        ) : (
          <TxForm wallets={wallets} categories={categories} initial={tx} onDone={close} />
        )}
      </Dialog>

      <Dialog open={mode === "delete"} onClose={close} title="Hapus transaksi ini?">
        <p className="mb-4 text-sm text-on-surface-variant">Transaksi akan dihapus permanen dan saldo dompet dihitung ulang.</p>
        <FormError message={error} />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>
            Batal
          </Button>
          <Button variant="danger" disabled={pending} onClick={remove}>
            {pending ? "Menghapus…" : "Hapus"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
