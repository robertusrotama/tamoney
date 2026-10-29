"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { AmountInput, withDots } from "@/components/ui/AmountInput";
import { Button } from "@/components/ui/Button";
import { Field, FormError, Input, Select } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { useFormDone } from "@/components/ui/useFormDone";
import { TransferForm } from "@/components/wallets/TransferForm";
import { saveTransaction } from "@/lib/actions/transactions";
import { parseRupiah } from "@/lib/money";
import { todayWib, wibDate } from "@/lib/reports";
import type { Category, Tx, Wallet } from "@/lib/types";

const QUICK = [20_000, 50_000, 100_000, 500_000];
type Kind = "expense" | "income" | "transfer";

/**
 * Catat: expense / income / transfer in one place (transfer only when creating; an edit keeps its type).
 * wallets = active wallets (plus the edited row's own).
 */
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

  const switcher = (
    <Segmented
      value={kind}
      onChange={setKind}
      options={[
        { value: "expense", label: "Pengeluaran", tone: "text-negative" },
        { value: "income", label: "Pemasukan", tone: "text-positive" },
        ...(initial ? [] : [{ value: "transfer" as const, label: "Transfer", tone: "text-tertiary" }]),
      ]}
    />
  );

  if (kind === "transfer") {
    return (
      <div className="space-y-4">
        {switcher}
        {wallets.length < 2 ? (
          <p className="text-[15px] text-on-surface-variant">Butuh minimal 2 dompet aktif untuk transfer.</p>
        ) : (
          <TransferForm wallets={wallets} onDone={onDone} />
        )}
      </div>
    );
  }

  const options = categories.filter((c) => c.kind === kind);
  return (
    <form onSubmit={onSubmit} key={version} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="kind" value={kind} />
      {switcher}

      <div className="space-y-2">
        <AmountInput name="amount" value={amount} onChange={setAmount} large />
        <div className="flex gap-2">
          {QUICK.map((q) => (
            <motion.button
              key={q}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => setAmount(withDots(String((parseRupiah(amount) ?? 0) + q)))}
              className="flex-1 rounded-full bg-primary-container py-1.5 text-[13px] font-semibold text-on-primary-container tabular-nums"
            >
              +{q / 1000}rb
            </motion.button>
          ))}
        </div>
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
        {pending ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}
