import type { WalletType } from "@/lib/types";

// Plain module (not "use client") so server pages can read these values.
export const WALLET_ICON: Record<WalletType, string> = { cash: "payments", bank: "account_balance", ewallet: "smartphone", other: "wallet" };

/** Wallet-app style card faces, one gradient per wallet type. */
export const WALLET_GRADIENT: Record<WalletType, string> = {
  bank: "from-[#0a84ff] to-[#0040dd]",
  ewallet: "from-[#30d158] to-[#0b8a3a]",
  cash: "from-[#ff9f0a] to-[#c93400]",
  other: "from-[#8e8e93] to-[#48484a]",
};
