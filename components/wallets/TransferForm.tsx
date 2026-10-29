"use client";

import { AmountInput } from "@/components/ui/AmountInput";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Field, FormError, Input } from "@/components/ui/Field";
import { Picker } from "@/components/ui/Picker";
import { WALLET_ICON } from "./style";
import { useFormDone } from "@/components/ui/useFormDone";
import { saveTransfer } from "@/lib/actions/transactions";
import { todayWib, wibDate } from "@/lib/reports";
import type { Tx, Wallet } from "@/lib/types";

/** wallets = active wallets; an edited transfer also offers its own (possibly archived) wallets. */
export function TransferForm({ wallets, initial, onDone }: { wallets: Wallet[]; initial?: Tx; onDone?: () => void }) {
  const { state, pending, onSubmit, version } = useFormDone(saveTransfer, onDone);
  const options = wallets.map((w) => ({ value: w.id, label: w.name, icon: WALLET_ICON[w.type] }));

  return (
    <form method="post" onSubmit={onSubmit} key={version} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dari dompet">
          <Picker name="wallet_id" label="Dari dompet" placeholder="Pilih dompet" defaultValue={initial?.wallet_id ?? ""} options={options} />
        </Field>
        <Field label="Ke dompet">
          <Picker name="to_wallet_id" label="Ke dompet" placeholder="Pilih dompet" defaultValue={initial?.to_wallet_id ?? ""} options={options} />
        </Field>
      </div>
      <AmountInput name="amount" defaultValue={initial?.amount} large />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Catatan">
          <Input name="note" defaultValue={initial?.note ?? ""} maxLength={200} placeholder="Opsional" />
        </Field>
        <Field label="Tanggal">
          <DateField name="occurred_at" label="Tanggal" today={todayWib()} defaultValue={initial ? wibDate(initial.occurred_at) : todayWib()} />
        </Field>
      </div>
      <FormError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan…" : "Transfer"}
      </Button>
    </form>
  );
}
