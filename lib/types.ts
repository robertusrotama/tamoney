export type TxKind = "income" | "expense" | "transfer";
export type WalletType = "cash" | "bank" | "ewallet" | "credit" | "other";

export type Wallet = {
  id: string;
  name: string;
  type: WalletType;
  initial_balance: number;
  archived_at: string | null;
  balance: number;
  color: string | null;
  pattern: string | null;
};

export type Category = {
  id: string;
  kind: "income" | "expense";
  name: string;
  icon: string;
};

export type Tx = {
  id: string;
  kind: TxKind;
  amount: number;
  wallet_id: string;
  to_wallet_id: string | null;
  category_id: string | null;
  note: string | null;
  occurred_at: string;
};

export const WALLET_TYPE_LABEL: Record<WalletType, string> = {
  cash: "Tunai",
  bank: "Bank",
  ewallet: "E-Wallet",
  credit: "Kartu Kredit",
  other: "Lainnya",
};
