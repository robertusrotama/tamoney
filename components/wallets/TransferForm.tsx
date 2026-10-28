"use client";

import { AmountInput } from "@/components/ui/AmountInput";
import { Button } from "@/components/ui/Button";
import { Field, FormError, Input, Select } from "@/components/ui/Field";
import { useFormDone } from "@/components/ui/useFormDone";
import { saveTransfer } from "@/lib/actions/transactions";
import { todayWib, wibDate } from "@/lib/reports";
import type { Tx, Wallet } from "@/lib/types";

/** wallets = active wallets; an edited transfer also offers its own (possibly archived) wallets. */
export function TransferForm({ wallets, initial, onDone }: { wallets: Wallet[]; initial?: Tx; onDone?: () => void }) {
  const { state, pending, onSubmit, version } = useFormDone(saveTransfer, onDone);
  const options = (
    <>
      <option value="">Pilih dompet</option>
      {wallets.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
    </>
  );

  return (
    <form onSubmit={onSubmit} key={version} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dari dompet">
          <Select name="wallet_id" defaultValue={initial?.wallet_id ?? ""} required>
            {options}
          </Select>
        </Field>
        <Field label="Ke dompet">
          <Select name="to_wallet_id" defaultValue={initial?.to_wallet_id ?? ""} required>
            {options}
          </Select>
        </Field>
      </div>
      <Field label="Nominal transfer">
        <AmountInput name="amount" defaultValue={initial?.amount} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Catatan">
          <Input name="note" defaultValue={initial?.note ?? ""} maxLength={200} placeholder="Opsional" />
        </Field>
        <Field label="Tanggal">
          <Input name="occurred_at" type="date" defaultValue={initial ? wibDate(initial.occurred_at) : todayWib()} required />
        </Field>
      </div>
      <FormError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan…" : "Simpan Transfer"}
      </Button>
    </form>
  );
}
