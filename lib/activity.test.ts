import { describe, expect, it } from "vitest";
import { walletActivity } from "./activity";

const W = "w1";
const tx = (kind: "income" | "expense" | "transfer", amount: number, from = W, to: string | null = null) => ({
  id: `${kind}-${amount}`,
  kind,
  amount,
  wallet_id: from,
  to_wallet_id: to,
});

describe("walletActivity", () => {
  it("signs each row from the wallet's point of view", () => {
    const rows = walletActivity([tx("income", 100), tx("expense", 30), tx("transfer", 20, W, "w2"), tx("transfer", 50, "w2", W)], W, 0);
    expect(rows.map((r) => r.delta)).toEqual([100, -30, -20, 50]);
  });

  it("walks the running balance backwards from the current balance (rows newest first)", () => {
    // current balance 150; newest: +50 transfer in, then -30 expense, then +100 income
    const rows = walletActivity([tx("transfer", 50, "w2", W), tx("expense", 30), tx("income", 100)], W, 150);
    expect(rows.map((r) => r.balanceAfter)).toEqual([150, 100, 130]);
  });

  it("returns an empty list for a wallet with no activity", () => {
    expect(walletActivity([], W, 500)).toEqual([]);
  });
});
