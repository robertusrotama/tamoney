"use client";

import { useState, useTransition } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Dialog, useDialog } from "@/components/ui/Dialog";
import { FormError } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { TransferForm } from "@/components/wallets/TransferForm";
import { deleteTransaction } from "@/lib/actions/transactions";
import type { Category, Tx, Wallet } from "@/lib/types";
import { TxForm } from "./TxForm";

/** Edit + delete for one history row. allWallets includes archived ones; the form offers active + this row's own. */
export function TxActions({ tx, allWallets, categories }: { tx: Tx; allWallets: Wallet[]; categories: Category[] }) {
  const edit = useDialog();
  const del = useDialog();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const wallets = allWallets.filter((w) => !w.archived_at || w.id === tx.wallet_id || w.id === tx.to_wallet_id);

  const remove = () =>
    start(async () => {
      const res = await deleteTransaction(tx.id);
      if (res.error) setError(res.error);
      else del.close();
    });

  return (
    <div className="-mr-2 flex shrink-0">
      <IconButton onClick={edit.show} aria-label="Ubah transaksi">
        <Icon name="edit" className="text-[18px]" />
      </IconButton>
      <IconButton
        onClick={(e) => {
          setError(undefined);
          del.show(e);
        }}
        aria-label="Hapus transaksi"
        className="hover:bg-negative-container hover:text-negative"
      >
        <Icon name="delete" className="text-[18px]" />
      </IconButton>

      <Dialog open={edit.open} origin={edit.origin} onClose={edit.close} title={tx.kind === "transfer" ? "Ubah Transfer" : "Ubah Transaksi"}>
        {tx.kind === "transfer" ? (
          <TransferForm wallets={wallets} initial={tx} onDone={edit.close} />
        ) : (
          <TxForm wallets={wallets} categories={categories} initial={tx} onDone={edit.close} />
        )}
      </Dialog>

      <Dialog open={del.open} origin={del.origin} onClose={del.close} title="Hapus transaksi?">
        <p className="mb-4 text-[15px] text-on-surface-variant">Transaksi dihapus permanen dan saldo dompet dihitung ulang.</p>
        <FormError message={error} />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="tonal" onClick={del.close}>
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
