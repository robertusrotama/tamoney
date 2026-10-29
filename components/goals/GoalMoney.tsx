"use client";

import { AmountInput } from "@/components/ui/AmountInput";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Dialog, useDialog } from "@/components/ui/Dialog";
import { Field, FormError } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { Picker } from "@/components/ui/Picker";
import { useFormDone } from "@/components/ui/useFormDone";
import { WALLET_ICON } from "@/components/wallets/style";
import { saveTransfer } from "@/lib/actions/transactions";
import type { GoalWithProgress } from "@/lib/goals";
import { todayWib } from "@/lib/reports";
import type { Wallet } from "@/lib/types";

type Mode = "setor" | "tarik";

/** Setor = transfer into the goal's wallet; Tarik = out of it. Both are transfers tagged with goal_id. */
function GoalMoneyForm({ goal, wallets, mode, onDone }: { goal: GoalWithProgress; wallets: Wallet[]; mode: Mode; onDone: () => void }) {
  const { state, pending, onSubmit } = useFormDone(saveTransfer, onDone);
  const today = todayWib();
  const goalWallet = wallets.find((w) => w.id === goal.wallet_id);
  const others = wallets.filter((w) => w.id !== goal.wallet_id).map((w) => ({ value: w.id, label: w.name, icon: WALLET_ICON[w.type] }));
  const suggested = mode === "setor" ? Math.max(0, goal.need - goal.depositedThisPeriod) : 0;
  const otherSide = mode === "setor" ? "wallet_id" : "to_wallet_id";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="goal_id" value={goal.id} />
      <input type="hidden" name={mode === "setor" ? "to_wallet_id" : "wallet_id"} value={goal.wallet_id} />
      <input type="hidden" name="note" value={`${mode === "setor" ? "Setor" : "Tarik"} ${goal.name}`} />
      <div className="flex items-center gap-3 rounded-[14px] bg-surface-dim/60 px-3 py-2.5">
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary-container text-primary">
          <Icon name={goal.icon} className="text-[20px]" filled />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold">{goal.name}</p>
          <p className="text-[13px] text-on-surface-variant">
            Terkumpul <Money value={goal.saved} /> di {goalWallet?.name ?? "dompet goal"}
          </p>
        </div>
      </div>
      <AmountInput name="amount" defaultValue={suggested || undefined} large />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={mode === "setor" ? "Dari dompet" : "Ke dompet"}>
          <Picker
            name={otherSide}
            label={mode === "setor" ? "Dari dompet" : "Ke dompet"}
            placeholder="Pilih dompet"
            defaultValue={mode === "setor" && goal.source_wallet_id && others.some((o) => o.value === goal.source_wallet_id) ? goal.source_wallet_id : ""}
            options={others}
          />
        </Field>
        <Field label="Tanggal">
          <DateField name="occurred_at" label="Tanggal" today={today} defaultValue={today} />
        </Field>
      </div>
      <FormError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan…" : mode === "setor" ? "Setor" : "Tarik"}
      </Button>
    </form>
  );
}

/** Setor/Tarik button + dialog; reused by the notification panel. wallets = active wallets. */
export function GoalMoneyButton({ goal, wallets, mode, size = "sm" }: { goal: GoalWithProgress; wallets: Wallet[]; mode: Mode; size?: "sm" | "md" }) {
  const d = useDialog();
  return (
    <>
      <Button variant={mode === "setor" ? "tonal" : "ghost"} size={size} onClick={d.show}>
        {mode === "setor" ? "Setor" : "Tarik"}
      </Button>
      <Dialog open={d.open} origin={d.origin} onClose={d.close} title={mode === "setor" ? "Setor ke goal" : "Tarik dari goal"}>
        <GoalMoneyForm goal={goal} wallets={wallets} mode={mode} onDone={d.close} />
      </Dialog>
    </>
  );
}
