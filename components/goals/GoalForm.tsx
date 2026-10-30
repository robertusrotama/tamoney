"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useT } from "@/components/I18n";
import { AmountInput } from "@/components/ui/AmountInput";
import { Button, IconButton, type ButtonVariant } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Dialog, useDialog } from "@/components/ui/Dialog";
import { Field, FormError, Input } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Picker } from "@/components/ui/Picker";
import { useFormDone } from "@/components/ui/useFormDone";
import { WALLET_ICON } from "@/components/wallets/style";
import { saveGoal } from "@/lib/actions/goals";
import { periodNeed } from "@/lib/goals";
import { parseRupiah } from "@/lib/money";
import { todayWib } from "@/lib/reports";
import type { Goal, Wallet } from "@/lib/types";

const nextYear = (d: string) => `${Number(d.slice(0, 4)) + 1}${d.slice(4)}`;
const ICONS = [
  "savings",
  "health_and_safety",
  "flight",
  "home",
  "directions_car",
  "school",
  "trending_up",
  "laptop_mac",
  "favorite",
  "celebration",
  "child_care",
  "phone_iphone",
];

function GoalForm({ goal, wallets, payday, periodMonth, onDone }: { goal?: Goal; wallets: Wallet[]; payday: number; periodMonth: string; onDone: () => void }) {
  const t = useT();
  const locale = useLocale();
  const { state, pending, onSubmit } = useFormDone(saveGoal, onDone);
  const today = todayWib();
  const [icon, setIcon] = useState(goal?.icon ?? "savings");
  const [target, setTarget] = useState(goal ? String(goal.target).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "");
  const [initial, setInitial] = useState(goal ? String(goal.initial_amount).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "");
  const [hasDue, setHasDue] = useState(!!goal?.due_date || !goal);
  const [due, setDue] = useState(goal?.due_date ?? nextYear(todayWib()));
  const options = wallets.map((w) => ({ value: w.id, label: w.name, icon: WALLET_ICON[w.type] }));

  const suggest =
    hasDue && due && parseRupiah(target)
      ? periodNeed({ ...(goal as Goal), target: parseRupiah(target) ?? 0, due_date: due, monthly_amount: null }, parseRupiah(initial) ?? 0, periodMonth, payday)
      : 0;

  return (
    <form method="post" onSubmit={onSubmit} className="space-y-4">
      {goal && <input type="hidden" name="id" value={goal.id} />}
      <input type="hidden" name="icon" value={icon} />
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {ICONS.map((i) => (
          <IconButton
            key={i}
            aria-label={i}
            aria-pressed={i === icon}
            tone={i === icon ? "primary" : "muted"}
            className={i === icon ? "bg-primary-container" : "bg-surface-dim"}
            onClick={() => setIcon(i)}
          >
            <Icon name={i} className="text-[20px]" filled={i === icon} />
          </IconButton>
        ))}
      </div>
      <Field label="Nama goal">
        <Input name="name" defaultValue={goal?.name} maxLength={50} placeholder="Contoh: Dana Darurat, Liburan Jepang" required />
      </Field>
      <Field label="Target">
        <AmountInput name="target" value={target} onChange={setTarget} large />
      </Field>
      <Field label="Sudah terkumpul" info="Uang yang sudah ada sebelum memakai TaMoney">
        <AmountInput name="initial_amount" value={initial} onChange={setInitial} required={false} />
      </Field>
      <div className="grid gap-4">
        <Field label="Due date">
          {hasDue ? (
            <div className="flex min-w-0 items-center gap-1">
              <div className="min-w-0 flex-1">
                <DateField name="due_date" label="Due date" today={today} defaultValue={due} max={null} onChange={setDue} />
              </div>
              <IconButton aria-label="Tanpa due date" onClick={() => setHasDue(false)}>
                <Icon name="close" className="text-[18px]" />
              </IconButton>
            </div>
          ) : (
            <Button type="button" variant="outline" className="w-full" onClick={() => setHasDue(true)}>
              <Icon name="event" className="text-[18px]" /> Tambah due date
            </Button>
          )}
        </Field>
        <Field
          label="Setoran bulanan"
          info={hasDue ? "Opsional jika ada due date — kalau kosong, TaMoney menghitungnya dari target dan due date" : "Wajib tanpa due date"}
        >
          <AmountInput name="monthly_amount" defaultValue={goal?.monthly_amount ?? undefined} required={false} />
          {suggest > 0 && <p className="px-1 pt-1 text-[12px] text-primary">{t("Saran: Rp {n}/bulan", { n: suggest.toLocaleString(locale) })}</p>}
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Disimpan di">
          <Picker name="wallet_id" label="Disimpan di" placeholder="Pilih dompet" defaultValue={goal?.wallet_id ?? ""} options={options} />
        </Field>
        <Field label="Sumber setoran">
          <Picker name="source_wallet_id" label="Sumber setoran" placeholder="Pilih dompet" defaultValue={goal?.source_wallet_id ?? ""} options={options} />
        </Field>
      </div>
      <FormError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan…" : goal ? "Simpan" : "Buat goal"}
      </Button>
    </form>
  );
}

export function GoalDialog({
  goal,
  wallets,
  payday,
  periodMonth,
  variant = "tonal",
  children,
}: {
  goal?: Goal;
  wallets: Wallet[];
  payday: number;
  periodMonth: string;
  variant?: ButtonVariant | "icon";
  children: ReactNode;
}) {
  const d = useDialog();
  return (
    <>
      {variant === "icon" ? (
        <IconButton onClick={d.show} aria-label={`Ubah ${goal?.name ?? "goal"}`}>
          {children}
        </IconButton>
      ) : (
        <Button variant={variant} onClick={d.show}>
          {children}
        </Button>
      )}
      <Dialog open={d.open} origin={d.origin} onClose={d.close} title={goal ? "Ubah goal" : "Buat goal"}>
        <GoalForm goal={goal} wallets={wallets} payday={payday} periodMonth={periodMonth} onDone={d.close} />
      </Dialog>
    </>
  );
}
