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
  budget_group_id: string | null;
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
  goal_id?: string | null;
  bill_id?: string | null;
};

export type BudgetGroup = { id: string; name: string; icon: string; pct_bp: number; is_savings: boolean; sort: number; archived_at?: string | null };
/** allocations: group id → rupiah */
export type BudgetPeriod = { id: string; month: string; start_date: string; salary: number; income_tx_id: string | null; allocations: Record<string, number> };
export type Cadence = "weekly" | "monthly" | "yearly";
export type Bill = {
  id: string;
  name: string;
  icon: string;
  amount: number;
  category_id: string;
  wallet_id: string;
  cadence: Cadence;
  due_day: number | null;
  next_due: string;
  remind_days: number;
  archived_at: string | null;
};
export type Goal = {
  id: string;
  name: string;
  icon: string;
  target: number;
  initial_amount: number;
  due_date: string | null;
  monthly_amount: number | null;
  wallet_id: string;
  source_wallet_id: string | null;
  achieved_at: string | null;
  archived_at: string | null;
  created_at: string;
};

export const WALLET_TYPE_LABEL: Record<WalletType, string> = {
  cash: "Tunai",
  bank: "Bank",
  ewallet: "E-Wallet",
  credit: "Kartu Kredit",
  other: "Lainnya",
};
