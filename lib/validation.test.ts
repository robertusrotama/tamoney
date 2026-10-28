import { describe, expect, it } from "vitest";
import { transferSchema, txSchema, walletSchema } from "./validation";

const A = "6f1c2b9e-3a4d-4c5e-8f70-1a2b3c4d5e6f";
const B = "7a2d3c0f-4b5e-4d6f-9081-2b3c4d5e6f70";
const okTx = { kind: "expense", amount: "50.000", wallet_id: A, category_id: B, occurred_at: "2026-10-29" };
const okTransfer = { amount: "100000", wallet_id: A, to_wallet_id: B, occurred_at: "2026-10-29" };

describe("txSchema", () => {
  it("parses a formatted rupiah amount", () => {
    expect(txSchema.safeParse(okTx).data?.amount).toBe(50000);
  });

  it("rejects zero, decimals, empty, text and amounts above 1 trillion", () => {
    for (const amount of ["0", "1,5", "", "abc", "1000000000001"]) {
      expect(txSchema.safeParse({ ...okTx, amount }).success).toBe(false);
    }
  });

  it("rejects a malformed date", () => {
    expect(txSchema.safeParse({ ...okTx, occurred_at: "29/10/2026" }).success).toBe(false);
  });
});

describe("transferSchema", () => {
  it("rejects transferring to the same wallet", () => {
    expect(transferSchema.safeParse(okTransfer).success).toBe(true);
    expect(transferSchema.safeParse({ ...okTransfer, to_wallet_id: A }).success).toBe(false);
  });
});

describe("walletSchema", () => {
  it("requires a name of 1-50 characters", () => {
    expect(walletSchema.safeParse({ name: "BCA", type: "bank", initial_balance: "0" }).success).toBe(true);
    expect(walletSchema.safeParse({ name: "  ", type: "cash", initial_balance: "0" }).success).toBe(false);
    expect(walletSchema.safeParse({ name: "x".repeat(51), type: "cash", initial_balance: "0" }).success).toBe(false);
  });

  it("allows an empty starting balance as 0", () => {
    expect(walletSchema.safeParse({ name: "Tunai", type: "cash", initial_balance: "" }).data?.initial_balance).toBe(0);
  });
});
