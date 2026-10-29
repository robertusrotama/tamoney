import { describe, expect, it } from "vitest";
import { billSchema, budgetSettingsSchema, goalSchema, payBillSchema, salarySchema, transferSchema, txSchema, walletSchema } from "./validation";

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

describe("salarySchema", () => {
  const ok = { month: "2026-10", amount: "12.000.000", wallet_id: A, occurred_at: "2026-10-25", alloc: { [B]: "12.000.000" } };
  it("parses salary and allocations", () => {
    const d = salarySchema.safeParse(ok).data;
    expect(d?.amount).toBe(12_000_000);
    expect(d?.alloc).toEqual({ [B]: 12_000_000 });
  });
  it("rejects a bad month", () => expect(salarySchema.safeParse({ ...ok, month: "2026-13" }).success).toBe(false));
  it("rejects allocations that do not add up", () => {
    const r = salarySchema.safeParse({ ...ok, alloc: { [B]: "11.000.000" } });
    expect(r.error?.issues[0].message).toBe("Total alokasi harus sama dengan gaji");
  });
});

describe("budgetSettingsSchema", () => {
  const pos = (name: string, pct_bp: number, is_savings = false, category_ids: string[] = []) => ({ id: null, name, icon: "savings", pct_bp, is_savings, category_ids });
  const ok = { payday: 25, groups: [pos("Tabungan", 3333, true), pos("Makan", 6667, false, [A]), pos("Lain", 0, false, [B])] };
  const msg = (v: unknown) => budgetSettingsSchema.safeParse(v).error?.issues[0].message;

  it("accepts a valid setup", () => expect(budgetSettingsSchema.safeParse(ok).success).toBe(true));
  it("total must be exactly 100%", () =>
    expect(msg({ ...ok, groups: [pos("Tabungan", 3323, true), ok.groups[1], ok.groups[2]] })).toBe("Total persentase harus 100%"));
  it("rejects percentages outside 0–100", () => {
    expect(budgetSettingsSchema.safeParse({ ...ok, groups: [pos("Tabungan", 10001, true), pos("Makan", -1)] }).success).toBe(false);
  });
  it("needs exactly one savings pos", () => {
    expect(msg({ ...ok, groups: [pos("A", 5000), pos("B", 5000)] })).toBe("Harus ada tepat satu pos Tabungan");
    expect(msg({ ...ok, groups: [pos("A", 5000, true), pos("B", 5000, true)] })).toBe("Harus ada tepat satu pos Tabungan");
  });
  it("a category sits in one pos only", () =>
    expect(msg({ ...ok, groups: [pos("Tabungan", 3333, true, [A]), pos("Makan", 6667, false, [A])] })).toBe("Satu kategori hanya boleh di satu pos"));
  it("payday is 1–28", () => expect(budgetSettingsSchema.safeParse({ ...ok, payday: 29 }).success).toBe(false));
});

describe("billSchema / payBillSchema", () => {
  const netflix = { name: "Netflix", icon: "subscriptions", amount: "186.000", category_id: A, wallet_id: B, cadence: "monthly", next_due: "2026-11-05", remind_days: "3" };
  it("accepts a monthly bill", () => expect(billSchema.safeParse(netflix).data).toMatchObject({ amount: 186_000, remind_days: 3 }));
  it("reminds 0–14 days ahead", () => expect(billSchema.safeParse({ ...netflix, remind_days: "15" }).success).toBe(false));
  it("pay amount must be positive", () =>
    expect(payBillSchema.safeParse({ bill_id: A, due: "2026-11-05", amount: "0", wallet_id: B, occurred_at: "2026-10-29" }).success).toBe(false));
});

describe("goalSchema", () => {
  const ok = { name: "Dana Darurat", icon: "savings", target: "24.000.000", initial_amount: "", due_date: "2027-04-30", monthly_amount: "", wallet_id: A, source_wallet_id: B };
  it("accepts a goal with a due date", () => expect(goalSchema.safeParse(ok).data).toMatchObject({ target: 24_000_000, initial_amount: 0, monthly_amount: null }));
  it("needs a due date or a monthly amount", () =>
    expect(goalSchema.safeParse({ ...ok, due_date: "" }).error?.issues[0].message).toBe("Isi due date atau setoran bulanan"));
  it("rejects a zero target", () => expect(goalSchema.safeParse({ ...ok, target: "0" }).success).toBe(false));
  it("allows already having more than the target", () => expect(goalSchema.safeParse({ ...ok, initial_amount: "30.000.000" }).success).toBe(true));
  it("source and destination differ", () =>
    expect(goalSchema.safeParse({ ...ok, source_wallet_id: A }).error?.issues[0].message).toBe("Dompet sumber dan tujuan harus berbeda"));
});
