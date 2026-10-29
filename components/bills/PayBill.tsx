"use client";

import { AmountInput } from "@/components/ui/AmountInput";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Dialog, useDialog } from "@/components/ui/Dialog";
import { Field, FormError } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Picker } from "@/components/ui/Picker";
import { useFormDone } from "@/components/ui/useFormDone";
import { WALLET_ICON } from "@/components/wallets/style";
import { payBill } from "@/lib/actions/bills";
import { todayWib } from "@/lib/reports";
import type { Bill, Wallet } from "@/lib/types";

const longDate = (d: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

function PayBillForm({ bill, wallets, onDone }: { bill: Bill; wallets: Wallet[]; onDone: () => void }) {
  const { state, pending, onSubmit } = useFormDone(payBill, onDone);
  const today = todayWib();
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="bill_id" value={bill.id} />
      <input type="hidden" name="due" value={bill.next_due} />
      <div className="flex items-center gap-3 rounded-[14px] bg-surface-dim/60 px-3 py-2.5">
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary-container text-primary">
          <Icon name={bill.icon} className="text-[20px]" filled />
        </span>
        <div>
          <p className="text-[17px] font-semibold">{bill.name}</p>
          <p className="text-[13px] text-on-surface-variant">Jatuh tempo {longDate(bill.next_due)}</p>
        </div>
      </div>
      <AmountInput name="amount" defaultValue={bill.amount} large />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bayar dari">
          <Picker
            name="wallet_id"
            label="Bayar dari"
            placeholder="Pilih dompet"
            defaultValue={wallets.some((w) => w.id === bill.wallet_id) ? bill.wallet_id : ""}
            options={wallets.map((w) => ({ value: w.id, label: w.name, icon: WALLET_ICON[w.type] }))}
          />
        </Field>
        <Field label="Tanggal bayar">
          <DateField name="occurred_at" label="Tanggal bayar" today={today} defaultValue={today} />
        </Field>
      </div>
      <FormError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan…" : "Tandai sudah dibayar"}
      </Button>
    </form>
  );
}

/** "Bayar" button + dialog; used on Rencana, in the notification panel and on Ringkasan. */
export function PayBillButton({ bill, wallets, size = "sm" }: { bill: Bill; wallets: Wallet[]; size?: "sm" | "md" }) {
  const d = useDialog();
  return (
    <>
      <Button variant="tonal" size={size} onClick={d.show}>
        Bayar
      </Button>
      <Dialog open={d.open} origin={d.origin} onClose={d.close} title="Bayar tagihan">
        <PayBillForm bill={bill} wallets={wallets} onDone={d.close} />
      </Dialog>
    </>
  );
}
