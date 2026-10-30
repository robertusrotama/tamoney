"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AmountInput, withDots } from "@/components/ui/AmountInput";
import { useT } from "@/components/I18n";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Field, FormError, Input } from "@/components/ui/Field";
import { Picker } from "@/components/ui/Picker";
import { WALLET_ICON } from "@/components/wallets/style";
import { AutoHeight } from "@/components/ui/AutoHeight";
import { Check } from "@/components/ui/Check";
import { PillTabs } from "@/components/ui/PillTabs";
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
  budgetPeriod,
}: {
  wallets: Wallet[];
  categories: Category[];
  initial?: Tx;
  onDone?: () => void;
  /** Running salary period: offers "Masukkan ke budget bulanan" for income. */
  budgetPeriod?: { id: string; label: string };
}) {
  const { state, pending, onSubmit, version } = useFormDone(saveTransaction, onDone);
  const t = useT();
  const [kind, setKind] = useState<Kind>(initial?.kind === "income" ? "income" : "expense");
  // An edited income keeps the period it already tops up; a new one can join the running period.
  const period = initial?.budget_period_id ? { id: initial.budget_period_id, label: "" } : budgetPeriod;
  const [toBudget, setToBudget] = useState(!!initial?.budget_period_id);
  // "Tagih ke teman": you paid for others and need to collect it back.
  const [owed, setOwed] = useState(!!initial?.owed_amount);
  const [owedAmount, setOwedAmount] = useState(initial?.owed_amount ? withDots(String(initial.owed_amount)) : "");
  // Kept here (not in the form) so switching Pengeluaran ↔ Pemasukan keeps the chosen wallet.
  const [walletId, setWalletId] = useState(initial?.wallet_id ?? wallets[0]?.id ?? "");
  const [amount, setAmount] = useState(initial ? withDots(String(initial.amount)) : "");
  const [seenVersion, setSeenVersion] = useState(version);
  if (version !== seenVersion) {
    setSeenVersion(version);
    setAmount("");
  }

  if (wallets.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">
        {t("Buat dompet dulu sebelum mencatat transaksi.")}{" "}
        <Link href="/dompet" className="font-semibold text-primary hover:underline">
          {t("Ke Kelola Dompet")}
        </Link>
      </p>
    );
  }

  const switcher = (
    <PillTabs
      value={kind}
      onChange={setKind}
      options={[
        {
          value: "expense",
          label: t("Pengeluaran"),
          icon: "north_east",
          tone: "bg-[#f97316]",
        },
        {
          value: "income",
          label: t("Pemasukan"),
          icon: "south_west",
          tone: "bg-primary",
        },
        ...(initial
          ? []
          : [
              {
                value: "transfer" as const,
                label: t("Transfer"),
                icon: "swap_horiz",
                tone: "bg-positive",
              },
            ]),
      ]}
    />
  );

  const options = categories.filter((c) => c.kind === kind);
  // One tab bar for all three kinds (so its pill always slides), and the same crossfade for every switch below it.
  return (
    <div className="space-y-4">
      {switcher}
      {/* popLayout: the new form is in place (and measured) at once while the old one fades out on top,
          so AutoHeight glides straight from the old height to the new one. */}
      <AutoHeight>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={kind}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
          >
            {kind === "transfer" ? (
              wallets.length < 2 ? (
                <p className="text-[15px] text-on-surface-variant">{t("Butuh minimal 2 dompet aktif untuk transfer.")}</p>
              ) : (
                <TransferForm wallets={wallets} onDone={onDone} />
              )
            ) : (
              <form method="post" onSubmit={onSubmit} key={version} className="space-y-4">
                {initial && <input type="hidden" name="id" value={initial.id} />}
                <input type="hidden" name="kind" value={kind} />

                <div className="space-y-2">
                  <AmountInput name="amount" value={amount} onChange={setAmount} large />
                  <div className="flex gap-2">
                    {QUICK.map((q) => (
                      <Button
                        key={q}
                        type="button"
                        variant="tonal"
                        size="sm"
                        onClick={() => setAmount(withDots(String((parseRupiah(amount) ?? 0) + q)))}
                        className="flex-1 tabular-nums"
                      >
                        +{q / 1000}
                        {t("rb")}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("Dompet")}>
                    <Picker
                      name="wallet_id"
                      label={t("Dompet")}
                      value={walletId}
                      onChange={setWalletId}
                      options={wallets.map((w) => ({
                        value: w.id,
                        label: w.name,
                        icon: WALLET_ICON[w.type],
                      }))}
                    />
                  </Field>
                  <Field label={t("Kategori")}>
                    <Picker
                      key={kind}
                      name="category_id"
                      label={t("Kategori")}
                      defaultValue={initial?.kind === kind ? (initial.category_id ?? "") : ""}
                      options={options.map((c) => ({
                        value: c.id,
                        label: c.name,
                        icon: c.icon,
                      }))}
                    />
                  </Field>
                </div>

                {kind === "expense" && (
                  <>
                    {owed && <input type="hidden" name="owed" value="1" />}
                    <Check
                      checked={owed}
                      onChange={(v) => {
                        setOwed(v);
                        if (v && !owedAmount) setOwedAmount(amount);
                      }}
                      hint={initial?.owed_settled_at ? t("Sudah dibayar kembali") : t("Masuk notifikasi sampai ditandai sudah dibayar")}
                    >
                      {t("Tagih ke teman")}
                    </Check>
                    {owed && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label={t("Yang ditagih")}>
                          <AmountInput name="owed_amount" value={owedAmount} onChange={setOwedAmount} required={false} />
                        </Field>
                        <Field label={t("Ke siapa")}>
                          <Input name="owed_note" defaultValue={initial?.owed_note ?? ""} maxLength={100} placeholder={t("Contoh: Budi, Sari")} />
                        </Field>
                      </div>
                    )}
                  </>
                )}

                {kind === "income" && period && (
                  <>
                    <input type="hidden" name="budget_period" value={toBudget ? period.id : ""} />
                    <Check
                      checked={toBudget}
                      onChange={setToBudget}
                      hint={
                        period.label
                          ? t("Ditambahkan ke budget {month}, dibagi sesuai persentase pos", { month: period.label })
                          : t("Dibagi sesuai persentase pos")
                      }
                    >
                      {t("Masukkan ke budget bulanan")}
                    </Check>
                  </>
                )}
                <Field label={t("Catatan")}>
                  <Input name="note" defaultValue={initial?.note ?? ""} maxLength={200} placeholder={t("Contoh: Makan siang mie ayam")} />
                </Field>
                <Field label={t("Tanggal")}>
                  <DateField name="occurred_at" label={t("Tanggal")} today={todayWib()} defaultValue={initial ? wibDate(initial.occurred_at) : todayWib()} />
                </Field>

                <FormError message={state.error} />
                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? t("Menyimpan…") : t("Simpan")}
                </Button>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </AutoHeight>
    </div>
  );
}
