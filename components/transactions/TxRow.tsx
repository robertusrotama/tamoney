import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import type { TxWithCategory } from "@/lib/queries";
import { wibDate, wibTime } from "@/lib/reports";

const TONE = {
  income: "bg-positive-container text-positive",
  expense: "bg-negative-container text-negative",
  transfer: "bg-tertiary-container text-tertiary",
};

/** One transaction line. walletName resolves ids; actions = optional edit/delete buttons. */
export function TxRow({
  tx,
  walletName,
  showDate,
  actions,
}: {
  tx: TxWithCategory;
  walletName: (id: string) => string;
  showDate?: boolean;
  actions?: ReactNode;
}) {
  const transfer = tx.kind === "transfer";
  const title = transfer ? "Transfer antar dompet" : tx.note || tx.category_name || "Transaksi";
  const signed = tx.kind === "expense" ? -tx.amount : tx.amount;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface px-3 py-3">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${TONE[tx.kind]}`}>
        <Icon name={transfer ? "swap_horiz" : (tx.category_icon ?? "receipt")} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-on-surface-variant">
          <span className="rounded bg-surface-dim px-1.5 py-0.5 font-mono text-[10px]">
            {transfer ? `${walletName(tx.wallet_id)} → ${walletName(tx.to_wallet_id!)}` : walletName(tx.wallet_id)}
          </span>{" "}
          {showDate ? `${wibDate(tx.occurred_at)} ` : ""}
          {wibTime(tx.occurred_at)} WIB{!transfer && tx.note && tx.category_name ? ` · ${tx.category_name}` : ""}
        </p>
      </div>
      <Money value={signed} sign={transfer ? "none" : "auto"} className="shrink-0 text-sm font-bold" />
      {actions}
    </div>
  );
}
