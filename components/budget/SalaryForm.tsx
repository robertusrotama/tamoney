"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { AmountInput, withDots } from "@/components/ui/AmountInput";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Confirm";
import { DateField } from "@/components/ui/DateField";
import { Dialog, useDialog } from "@/components/ui/Dialog";
import { Field, FormError } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { Picker } from "@/components/ui/Picker";
import { useFormDone } from "@/components/ui/useFormDone";
import { WALLET_ICON } from "@/components/wallets/style";
import { deleteSalary, recordSalary } from "@/lib/actions/budget";
import { allocate, monthLabel, shiftYm } from "@/lib/budget";
import { parseRupiah } from "@/lib/money";
import type { BudgetGroup, BudgetPeriod, Wallet } from "@/lib/types";

type Props = {
  groups: BudgetGroup[];
  periods: BudgetPeriod[];
  wallets: Wallet[];
  today: string;
  payday: number;
  salaryWallet: string | null;
};

const dots = (n: number) => withDots(String(n));
const dotted = (a: Record<string, number>) => Object.fromEntries(Object.entries(a).map(([k, v]) => [k, dots(v)]));

/** Month whose salary is due next: this month once payday has come (if not recorded yet), else the next. */
export function nextSalaryMonth(today: string, payday: number, periods: BudgetPeriod[]) {
  const ym = Number(today.slice(8)) >= payday ? today.slice(0, 7) : shiftYm(today.slice(0, 7), -1);
  return periods.some((p) => p.month.startsWith(ym)) ? shiftYm(ym, 1) : ym;
}

function SalaryForm({ groups, periods, wallets, today, payday, salaryWallet, month: initialMonth, onDone }: Props & { month: string; onDone: () => void }) {
  const { state, pending, onSubmit } = useFormDone(recordSalary, onDone);
  const existing = (m: string) => periods.find((p) => p.month.startsWith(m));
  const dateFor = (m: string) => {
    const d = `${m}-${String(payday).padStart(2, "0")}`;
    return d < today ? d : today;
  };

  const [month, setMonth] = useState(initialMonth);
  const [salary, setSalary] = useState(() => dots(existing(initialMonth)?.salary ?? periods.at(-1)?.salary ?? 0).replace(/^0$/, ""));
  const [alloc, setAlloc] = useState<Record<string, string>>(() => {
    const p = existing(initialMonth);
    return p ? dotted(p.allocations) : dotted(allocate(parseRupiah(salary) ?? 0, groups));
  });
  const [touched, setTouched] = useState(!!existing(initialMonth));

  const pickMonth = (m: string) => {
    setMonth(m);
    const p = existing(m);
    if (p) {
      setSalary(dots(p.salary));
      setAlloc(dotted(p.allocations));
      setTouched(true);
    }
  };
  const changeSalary = (v: string) => {
    setSalary(v);
    if (!touched) setAlloc(dotted(allocate(parseRupiah(v) ?? 0, groups)));
  };
  const recompute = () => {
    setAlloc(dotted(allocate(parseRupiah(salary) ?? 0, groups)));
    setTouched(false);
  };

  const total = Object.values(alloc).reduce((s, v) => s + (parseRupiah(v) ?? 0), 0);
  const target = parseRupiah(salary) ?? 0;
  const months = [...new Set([-2, -1, 0, 1].map((n) => shiftYm(today.slice(0, 7), n)).concat(periods.map((p) => p.month.slice(0, 7))))].sort().reverse();

  return (
    <form onSubmit={onSubmit} className="space-y-4" key={month}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Gaji bulan">
          <Picker
            name="month"
            label="Gaji bulan"
            value={month}
            onChange={pickMonth}
            options={months.map((m) => ({ value: m, label: monthLabel(m), icon: existing(m) ? "check_circle" : "calendar_month" }))}
          />
        </Field>
        <Field label="Masuk ke dompet">
          <Picker
            name="wallet_id"
            label="Masuk ke dompet"
            placeholder="Pilih dompet"
            defaultValue={salaryWallet && wallets.some((w) => w.id === salaryWallet) ? salaryWallet : ""}
            options={wallets.map((w) => ({ value: w.id, label: w.name, icon: WALLET_ICON[w.type] }))}
          />
        </Field>
      </div>
      <AmountInput name="amount" value={salary} onChange={changeSalary} large />
      <Field label="Tanggal diterima">
        <DateField name="occurred_at" label="Tanggal diterima" today={today} defaultValue={dateFor(month)} />
      </Field>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[13px] font-semibold tracking-[0.04em] text-on-surface-variant uppercase">Alokasi</p>
          {touched && (
            <Button type="button" variant="ghost" size="sm" onClick={recompute}>
              <Icon name="refresh" className="text-[16px]" /> Hitung ulang
            </Button>
          )}
        </div>
        <div className="divide-y divide-outline overflow-hidden rounded-[14px] bg-surface-dim/60">
          {groups.map((g) => (
            <label key={g.id} className="flex items-center gap-3 px-3 py-1.5">
              <Icon name={g.icon} className="text-[20px] text-on-surface-variant" />
              <span className="min-w-0 flex-1 truncate text-[15px]">
                {g.name}
                <span className="ml-1.5 text-[13px] text-on-surface-variant tabular-nums">{(g.pct_bp / 100).toLocaleString("id-ID")}%</span>
              </span>
              <span className="w-40 shrink-0">
                <AmountInput
                  name={`alloc_${g.id}`}
                  value={alloc[g.id] ?? ""}
                  onChange={(v) => {
                    setAlloc((a) => ({ ...a, [g.id]: v }));
                    setTouched(true);
                  }}
                  required={false}
                />
              </span>
            </label>
          ))}
        </div>
        <p className={`mt-2 text-right text-[13px] tabular-nums ${total === target ? "text-on-surface-variant" : "font-semibold text-negative"}`}>
          Total <Money value={total} /> dari <Money value={target} />
        </p>
      </div>

      <FormError message={state.error} />
      <Button type="submit" disabled={pending || total !== target || target === 0} className="w-full">
        {pending ? "Menyimpan…" : existing(month) ? "Simpan perubahan" : "Catat gaji"}
      </Button>
    </form>
  );
}

/** Button + dialog. `month` fixed = edit that month; otherwise the next salary month. */
export function SalaryButton({ month, variant = "primary", size, children, ...props }: Props & { month?: string; variant?: ButtonVariant; size?: "sm" | "md"; children: ReactNode }) {
  const d = useDialog();
  const m = month ?? nextSalaryMonth(props.today, props.payday, props.periods);
  return (
    <>
      <Button variant={variant} size={size} onClick={d.show}>
        {children}
      </Button>
      <Dialog open={d.open} origin={d.origin} onClose={d.close} title={props.periods.some((p) => p.month.startsWith(m)) ? "Ubah alokasi" : "Catat gaji"}>
        <SalaryForm {...props} month={m} onDone={d.close} />
      </Dialog>
    </>
  );
}

/** Deletes the shown month's salary after a confirm; the period and its salary transaction go together. */
export function DeleteSalaryButton({ periodId, label }: { periodId: string; label: string }) {
  const [confirm, dialog] = useConfirm();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const router = useRouter();
  const run = async () => {
    if (!(await confirm({ title: `Hapus gaji ${label}?`, message: "Periode budget dan transaksi gajinya ikut dihapus. Transaksi lain tidak berubah.", confirmLabel: "Hapus", destructive: true })))
      return;
    start(async () => {
      const res = await deleteSalary(periodId);
      setError(res.error);
      if (res.ok) router.push("/budget");
    });
  };
  return (
    <>
      <Button variant="danger" size="sm" onClick={run} disabled={pending}>
        <Icon name="delete" className="text-[16px]" /> Hapus gaji
      </Button>
      {error && <span className="text-[13px] text-negative">{error}</span>}
      {dialog}
    </>
  );
}
