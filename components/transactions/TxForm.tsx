"use client";

import Link from "next/link";
import { useState } from "react";
import { AmountInput, withDots } from "@/components/ui/AmountInput";
import { Button } from "@/components/ui/Button";
import { Field, FormError, Input, Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { useFormDone } from "@/components/ui/useFormDone";
import { saveTransaction } from "@/lib/actions/transactions";
import { parseRupiah } from "@/lib/money";
import { todayWib, wibDate } from "@/lib/reports";
import type { Category, Tx, Wallet } from "@/lib/types";

const QUICK = [20_000, 50_000, 100_000, 500_000];
type Kind = "expense" | "income";

/** Catat Singkat: income/expense entry and edit. wallets = active wallets (plus the edited row's own). */
export function TxForm({
  wallets,
  categories,
  initial,
  onDone,
}: {
  wallets: Wallet[];
  categories: Category[];
  initial?: Tx;
  onDone?: () => void;
}) {
  const { state, pending, onSubmit, version } = useFormDone(saveTransaction, onDone);
  const [kind, setKind] = useState<Kind>(initial?.kind === "income" ? "income" : "expense");
  const [amount, setAmount] = useState(initial ? withDots(String(initial.amount)) : "");
  const [seenVersion, setSeenVersion] = useState(version);
  if (version !== seenVersion) {
    setSeenVersion(version);
    setAmount("");
  }

  if (wallets.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">
        Buat dompet dulu sebelum mencatat transaksi.{" "}
        <Link href="/dompet" className="font-semibold text-primary hover:underline">
          Ke Kelola Dompet
        </Link>
      </p>
    );
  }

  const options = categories.filter((c) => c.kind === kind);
  const tab = (k: Kind, label: string, icon: string) => (
    <button
      type="button"
      onClick={() => setKind(k)}
      aria-pressed={kind === k}
      className={`flex flex-1 items-center justify-center gap-1 rounded-full py-2 text-sm font-semibold transition ${
        kind === k ? (k === "expense" ? "bg-card text-negative shadow-sm" : "bg-card text-positive shadow-sm") : "text-on-surface-variant"
      }`}
    >
      <Icon name={icon} className="text-lg" /> {label}
    </button>
  );

  return (
    <form onSubmit={onSubmit} key={version} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="kind" value={kind} />
      <div className="flex rounded-full bg-surface-dim p-1">
        {tab("expense", "Pengeluaran", "arrow_upward")}
        {tab("income", "Pemasukan", "arrow_downward")}
      </div>

      <Field label="Nominal (IDR)">
        <AmountInput name="amount" value={amount} onChange={setAmount} />
      </Field>
      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setAmount(withDots(String((parseRupiah(amount) ?? 0) + q)))}
            className="rounded-full bg-surface-dim px-3 py-1 font-mono text-xs font-medium text-on-surface-variant hover:bg-primary-container hover:text-primary"
          >
            +{q / 1000}rb
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Dompet">
          <Select name="wallet_id" defaultValue={initial?.wallet_id ?? wallets[0].id} required>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Kategori">
          <Select name="category_id" key={kind} defaultValue={initial?.kind === kind ? (initial.category_id ?? "") : ""} required>
            <option value="">Pilih</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Catatan">
        <Input name="note" defaultValue={initial?.note ?? ""} maxLength={200} placeholder="Contoh: Makan siang mie ayam" />
      </Field>
      <Field label="Tanggal">
        <Input name="occurred_at" type="date" defaultValue={initial ? wibDate(initial.occurred_at) : todayWib()} required />
      </Field>

      <FormError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full">
        <Icon name="check" className="text-lg" /> {pending ? "Menyimpan…" : "Simpan Transaksi"}
      </Button>
    </form>
  );
}
