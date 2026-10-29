import { describe, expect, it } from "vitest";
import { goalTransferError, walletError } from "./guards";

describe("walletError", () => {
  it("passes when every wallet is the user's and active", () => {
    expect(walletError(["a", "b"], ["a", "b", "c"])).toBeNull();
  });

  it("rejects a wallet that is archived or someone else's (not in the active list)", () => {
    expect(walletError(["a", "x"], ["a"])).toBe("Dompet tidak ditemukan atau sudah diarsipkan");
  });

  it("lets an edit keep the archived wallet it already had", () => {
    expect(walletError(["old"], [], ["old"])).toBeNull();
    expect(walletError(["other"], [], ["old"])).not.toBeNull();
  });
});

describe("goalTransferError", () => {
  it("one side must be the goal's wallet", () => {
    expect(goalTransferError("jago", "bca", "jago")).toBeNull();
    expect(goalTransferError("jago", "jago", "bca")).toBeNull();
    expect(goalTransferError("jago", "bca", "gopay")).toBe("Goal tidak valid");
  });
});
