import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { WALLET_TYPE_LABEL, type WalletType } from "@/lib/types";
import { WALLET_ICON, cardInk, cardStyle } from "./style";

export const CARD_H = 212; // px; the stack's overlap math depends on a fixed card height

type Face = { name: string; type: WalletType; balance: number; color?: string | null; pattern?: string | null };

/** Apple Wallet–style card face: header strip (icon, name, balance) stays readable when stacked. */
export function WalletFace({ wallet, actions, className = "" }: { wallet: Face; actions?: ReactNode; className?: string }) {
  const ink = cardInk(wallet);
  const muted = ink === "text-black" ? "text-black/60" : "text-white/75";
  return (
    <div
      style={{ ...cardStyle(wallet), height: CARD_H }}
      className={`relative flex flex-col justify-between overflow-hidden rounded-[16px] p-4 shadow-[0_-1px_0_rgb(255_255_255/0.25)_inset,0_10px_30px_-12px_rgb(0_0_0/0.5)] ${ink} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-black/75">
            <Icon name={WALLET_ICON[wallet.type]} className="text-[18px]" filled />
          </span>
          <p className="truncate text-[19px] font-semibold tracking-[-0.01em]">{wallet.name}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-[10px] font-semibold tracking-[0.06em] uppercase ${muted}`}>Saldo</p>
          <Money value={wallet.balance} className="text-[17px] font-semibold" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className={`text-[10px] font-semibold tracking-[0.06em] uppercase ${muted}`}>Jenis</p>
          <p className="text-[17px]">{WALLET_TYPE_LABEL[wallet.type]}</p>
        </div>
        {actions}
      </div>
    </div>
  );
}

