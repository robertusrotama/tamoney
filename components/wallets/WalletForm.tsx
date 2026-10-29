"use client";

import type { ReactNode } from "react";
import { AmountInput } from "@/components/ui/AmountInput";
import { Button, IconButton } from "@/components/ui/Button";
import { Dialog, useDialog } from "@/components/ui/Dialog";
import { Field, FormError, Input, Select } from "@/components/ui/Field";
import { useFormDone } from "@/components/ui/useFormDone";
import { saveWallet } from "@/lib/actions/wallets";
import { WALLET_TYPE_LABEL, type Wallet } from "@/lib/types";

function WalletForm({ wallet, onDone }: { wallet?: Wallet; onDone: () => void }) {
  const { state, pending, onSubmit } = useFormDone(saveWallet, onDone);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {wallet && <input type="hidden" name="id" value={wallet.id} />}
      <Field label="Nama dompet">
        <Input name="name" defaultValue={wallet?.name} maxLength={50} required placeholder="Contoh: BCA, GoPay, Tunai" />
      </Field>
      <Field label="Jenis">
        <Select name="type" defaultValue={wallet?.type ?? "cash"}>
          {Object.entries(WALLET_TYPE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Saldo awal">
        <AmountInput name="initial_balance" defaultValue={wallet?.initial_balance} required={false} />
      </Field>
      <FormError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}

/** A button that opens the wallet form in a dialog (add when no wallet, edit otherwise). */
export function WalletDialog({
  wallet,
  children,
  label,
  variant = "primary",
}: {
  wallet?: Wallet;
  children: ReactNode;
  label?: string;
  variant?: "primary" | "tonal" | "icon";
}) {
  const d = useDialog();
  return (
    <>
      {variant === "icon" ? (
        <IconButton onClick={d.show} aria-label={label} className="text-current hover:bg-white/15">
          {children}
        </IconButton>
      ) : (
        <Button variant={variant} onClick={d.show}>
          {children}
        </Button>
      )}
      <Dialog open={d.open} origin={d.origin} onClose={d.close} title={wallet ? "Ubah Dompet" : "Tambah Dompet"}>
        <WalletForm wallet={wallet} onDone={d.close} />
      </Dialog>
    </>
  );
}
