import type { ReactNode } from "react";
import { LocalDate, T } from "@/components/I18n";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import type { TxWithCategory } from "@/lib/queries";
import { wibDate, wibTime } from "@/lib/reports";

const TILE = {
  income: "bg-positive text-white",
  expense: "bg-negative text-white",
  transfer: "bg-tertiary text-white",
};


/** One inset-grouped list row. Put rows inside <TxList> for the hairline separators. */
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
  const title = transfer ? <T k="Transfer" /> : tx.note || tx.category_name || <T k="Transaksi" />;
  const subtitle = transfer
    ? `${walletName(tx.wallet_id)} → ${walletName(tx.to_wallet_id!)}`
    : [tx.note ? tx.category_name : null, walletName(tx.wallet_id)].filter(Boolean).join(" · ");
  const signed = tx.kind === "expense" ? -tx.amount : tx.amount;

  return (
    <div className="flex items-center gap-3 py-2.5 pl-4">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-[8px] ${TILE[tx.kind]}`}>
        <Icon name={transfer ? "swap_horiz" : (tx.category_icon ?? "receipt")} className="text-[19px]" filled />
      </span>
      <div data-sep className="-mb-2.5 flex min-w-0 flex-1 items-center gap-3 border-b border-outline pr-4 pb-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] leading-tight">{title}</p>
          <p className="truncate text-[13px] text-on-surface-variant">{subtitle}</p>
          {tx.owed_amount && !tx.owed_settled_at ? (
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-warning-container px-2 py-0.5 text-[11px] font-semibold text-warning">
              <T k="Tagih" /> <Money value={tx.owed_amount} />
            </span>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <Money value={signed} sign={transfer ? "none" : "auto"} className="text-[17px] font-medium" />
          <p className="text-[13px] text-on-surface-variant tabular-nums">
            {showDate && (
              <>
                <LocalDate date={wibDate(tx.occurred_at)} options={{ day: "numeric", month: "short" }} />,{" "}
              </>
            )}
            {wibTime(tx.occurred_at)}
          </p>
        </div>
        {actions}
      </div>
    </div>
  );
}

/** Grouped list container: rows separated by hairlines inset past the icon. */
export function TxList({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-[14px] bg-card [&>*:last-child_[data-sep]]:border-0">{children}</div>;
}
