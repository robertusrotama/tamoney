"use client";

import { useT } from "@/components/I18n";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Dialog, useDialog } from "@/components/ui/Dialog";
import { Field, FormError } from "@/components/ui/Field";
import { Money } from "@/components/ui/Money";
import { Picker } from "@/components/ui/Picker";
import { useFormDone } from "@/components/ui/useFormDone";
import { WALLET_ICON } from "@/components/wallets/style";
import { settleOwed } from "@/lib/actions/transactions";
import { todayWib } from "@/lib/reports";
import type { Wallet } from "@/lib/types";

type Owed = { id: string; owed_amount: number; owed_note: string | null };

function SettleForm({ owed, wallets, onDone }: { owed: Owed; wallets: Wallet[]; onDone: () => void }) {
  const { state, pending, onSubmit } = useFormDone(settleOwed, onDone);
  const t = useT();
  const today = todayWib();
  return (
    <form method="post" onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="tx_id" value={owed.id} />
      <p className="rounded-[14px] bg-positive-container px-4 py-3 text-[15px] text-positive">
        {owed.owed_note ? t("{who} membayar", { who: owed.owed_note }) : t("Teman membayar")} <Money value={owed.owed_amount} className="font-semibold" />
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Masuk ke dompet")}>
          <Picker
            name="wallet_id"
            label={t("Masuk ke dompet")}
            placeholder={t("Pilih dompet")}
            defaultValue={wallets[0]?.id ?? ""}
            options={wallets.map((w) => ({ value: w.id, label: w.name, icon: WALLET_ICON[w.type] }))}
          />
        </Field>
        <Field label={t("Tanggal")}>
          <DateField name="occurred_at" label={t("Tanggal")} today={today} defaultValue={today} />
        </Field>
      </div>
      <FormError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("Menyimpan…") : t("Tandai sudah dibayar")}
      </Button>
    </form>
  );
}

/** "Sudah dibayar" for money friends owe you: records the payback into a wallet (settleOwed). */
export function SettleOwedButton({ owed, wallets, size = "sm" }: { owed: Owed; wallets: Wallet[]; size?: "sm" | "md" }) {
  const d = useDialog();
  const t = useT();
  return (
    <>
      <Button variant="tonal" size={size} onClick={d.show}>
        {t("Sudah dibayar")}
      </Button>
      <Dialog open={d.open} origin={d.origin} onClose={d.close} title={t("Uang sudah kembali")}>
        <SettleForm owed={owed} wallets={wallets} onDone={d.close} />
      </Dialog>
    </>
  );
}
