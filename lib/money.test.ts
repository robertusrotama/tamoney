import { describe, expect, it } from "vitest";
import { formatRupiah, parseRupiah } from "./money";

describe("formatRupiah", () => {
  it("uses dot thousand separators", () => {
    expect(formatRupiah(1250000)).toBe("Rp 1.250.000");
    expect(formatRupiah(0)).toBe("Rp 0");
  });

  it("puts the minus sign before Rp", () => {
    expect(formatRupiah(-45000)).toBe("-Rp 45.000");
  });
});

describe("parseRupiah", () => {
  it("accepts typed and pasted amounts", () => {
    expect(parseRupiah("1.250.000")).toBe(1250000);
    expect(parseRupiah("Rp 50.000")).toBe(50000);
    expect(parseRupiah(" 20000 ")).toBe(20000);
  });

  it("rejects anything that is not a whole rupiah amount", () => {
    for (const bad of ["", "abc", "1,5", "12.5a", "Rp"]) expect(parseRupiah(bad)).toBeNull();
  });
});
