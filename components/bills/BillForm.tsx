"use client";

import { useState, type ReactNode } from "react";
import { AmountInput } from "@/components/ui/AmountInput";
import { Button, IconButton, type ButtonVariant } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Dialog, useDialog } from "@/components/ui/Dialog";
import { Field, FormError, Input } from "@/components/ui/Field";
import { Picker } from "@/components/ui/Picker";
import { Segmented } from "@/components/ui/Segmented";
import { useFormDone } from "@/components/ui/useFormDone";
import { WALLET_ICON } from "@/components/wallets/style";
import { saveBill } from "@/lib/actions/bills";
import { todayWib } from "@/lib/reports";
import type { Bill, Cadence, Category, Wallet } from "@/lib/types";

const CADENCE: { value: Cadence; label: string }[] = [
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
  { value: "yearly", label: "Tahunan" },
];

function BillForm({ bill, wallets, categories, onDone }: { bill?: Bill; wallets: Wallet[]; categories: Category[]; onDone: () => void }) {
  const { state, pending, onSubmit } = useFormDone(saveBill, onDone);
  const today = todayWib();
  const langganan = categories.find((c) => c.name === "Langganan");
  const [category, setCategory] = useState(bill?.category_id ?? langganan?.id ?? "");
  const [cadence, setCadence] = useState<Cadence>(bill?.cadence ?? "monthly");
  // Icon follows the category until the bill has its own.
  const icon = bill?.icon ?? categories.find((c) => c.id === category)?.icon ?? "receipt_long";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {bill && <input type="hidden" name="id" value={bill.id} />}
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="cadence" value={cadence} />
      <Field label="Nama tagihan">
        <Input name="name" defaultValue={bill?.name} maxLength={50} placeholder="Contoh: Netflix, Kost, Wifi" required />
      </Field>
      <AmountInput name="amount" defaultValue={bill?.amount} large />
      <Segmented value={cadence} onChange={setCadence} options={CADENCE} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jatuh tempo berikutnya">
          <DateField name="next_due" label="Jatuh tempo berikutnya" today={today} defaultValue={bill?.next_due ?? today} max={null} />
        </Field>
        <Field label="Ingatkan">
          <Picker
            name="remind_days"
            label="Ingatkan"
            defaultValue={String(bill?.remind_days ?? 3)}
            options={[0, 1, 2, 3, 5, 7, 14].map((n) => ({ value: String(n), label: n === 0 ? "Pada hari H" : `${n} hari sebelumnya` }))}
          />
        </Field>
        <Field label="Kategori">
          <Picker
            name="category_id"
            label="Kategori"
            placeholder="Pilih kategori"
            value={category}
            onChange={setCategory}
            options={categories.map((c) => ({ value: c.id, label: c.name, icon: c.icon }))}
          />
        </Field>
        <Field label="Bayar dari">
          <Picker
            name="wallet_id"
            label="Bayar dari"
            placeholder="Pilih dompet"
            defaultValue={bill?.wallet_id ?? ""}
            options={wallets.map((w) => ({ value: w.id, label: w.name, icon: WALLET_ICON[w.type] }))}
          />
        </Field>
      </div>
      <FormError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan…" : bill ? "Simpan" : "Tambah tagihan"}
      </Button>
    </form>
  );
}

/** Add (button) or edit (icon button) a bill. categories = expense categories. */
export function BillDialog({
  bill,
  wallets,
  categories,
  variant = "tonal",
  children,
}: {
  bill?: Bill;
  wallets: Wallet[];
  categories: Category[];
  variant?: ButtonVariant | "icon";
  children: ReactNode;
}) {
  const d = useDialog();
  return (
    <>
      {variant === "icon" ? (
        <IconButton onClick={d.show} aria-label={`Ubah ${bill?.name ?? "tagihan"}`}>
          {children}
        </IconButton>
      ) : (
        <Button variant={variant} onClick={d.show}>
          {children}
        </Button>
      )}
      <Dialog open={d.open} origin={d.origin} onClose={d.close} title={bill ? "Ubah tagihan" : "Tambah tagihan"}>
        <BillForm bill={bill} wallets={wallets} categories={categories} onDone={d.close} />
      </Dialog>
    </>
  );
}
