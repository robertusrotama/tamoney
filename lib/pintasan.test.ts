import { describe, expect, it } from "vitest";
import { categoryCandidates, hashToken, mapKind, newToken, parsePintasan, walletCandidates } from "./pintasan";

describe("mapKind", () => {
  it("maps the Shortcut's tipe, case-insensitive", () => {
    expect(mapKind("Expense")).toBe("expense");
    expect(mapKind("pengeluaran")).toBe("expense");
    expect(mapKind("Income")).toBe("income");
    expect(mapKind("Transfer")).toBe("income"); // money in from someone else
    expect(mapKind("??")).toBeNull();
  });
});

describe("categoryCandidates", () => {
  it("translates the AI's English categories, keeping the original as a fallback", () => {
    expect(categoryCandidates("Food")).toEqual(["makan & minum", "food"]);
    expect(categoryCandidates("Bibit")).toEqual(["investasi", "bibit"]);
    expect(categoryCandidates(" gereja ")).toEqual(["gereja"]);
  });
});

describe("walletCandidates", () => {
  it("resolves source aliases", () => {
    expect(walletCandidates("Credit Card")).toEqual(["kartu kredit", "credit card"]);
    expect(walletCandidates("Cash")).toEqual(["tunai", "cash"]);
    expect(walletCandidates("Cimb")).toEqual(["cimb"]);
    expect(walletCandidates("Unknown")).toEqual(["lainnya", "unknown"]);
  });
});

describe("parsePintasan", () => {
  const ok = { tipe: "Expense", kategori: "Food", jumlah: "25000", sumber: "BRI", text: "Mie ayam" };

  it("accepts the Shortcut's fields and parses the amount", () => {
    const r = parsePintasan(ok);
    expect(r.success && r.data).toEqual({ kind: "expense", kategori: "Food", amount: 25000, sumber: "BRI", note: "Mie ayam" });
  });

  it("accepts formatted amounts and a missing note", () => {
    const r = parsePintasan({ ...ok, jumlah: "Rp 25.000", text: "" });
    expect(r.success && r.data.amount).toBe(25000);
    expect(r.success && r.data.note).toBeNull();
  });

  it("rejects bad input with an Indonesian message", () => {
    expect(parsePintasan({ ...ok, jumlah: "0" })).toMatchObject({ success: false, error: "Nominal tidak valid" });
    expect(parsePintasan({ ...ok, tipe: "Lainnya" })).toMatchObject({ success: false, error: "Tipe harus Expense atau Income" });
    expect(parsePintasan({ ...ok, sumber: "" })).toMatchObject({ success: false, error: "Sumber dana wajib diisi" });
    expect(parsePintasan(null)).toMatchObject({ success: false });
  });
});

describe("tokens", () => {
  it("creates long random tokens with a prefix", () => {
    const a = newToken();
    expect(a).toMatch(/^tm_[A-Za-z0-9_-]{43}$/);
    expect(newToken()).not.toBe(a);
  });

  it("hashes with sha256 hex, the same as Postgres encode(digest(t, 'sha256'), 'hex')", () => {
    expect(hashToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
