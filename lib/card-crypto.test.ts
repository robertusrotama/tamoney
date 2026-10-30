import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptCard, encryptCard } from "./card-crypto";

const key = randomBytes(32).toString("base64");
const card = { number: "4111111111111111", expiry: "08/29", holder: "TAMA" };

describe("card encryption", () => {
  it("round-trips", () => expect(decryptCard(encryptCard(card, key), key)).toEqual(card));
  it("never repeats a ciphertext (random IV) and never contains the number", () => {
    const a = encryptCard(card, key);
    expect(a).not.toBe(encryptCard(card, key));
    expect(a).not.toContain("4111");
  });
  it("rejects a tampered ciphertext", () => {
    const [v, iv, tag, ct] = encryptCard(card, key).split(".");
    const flipped = ct.slice(0, -2) + (ct.at(-2) === "A" ? "B" : "A") + ct.at(-1);
    expect(() => decryptCard([v, iv, tag, flipped].join("."), key)).toThrow();
  });
  it("rejects the wrong key", () => expect(() => decryptCard(encryptCard(card, key), randomBytes(32).toString("base64"))).toThrow());
  it("refuses to run without a 32-byte key", () => expect(() => encryptCard(card, "short")).toThrow(/CARD_ENCRYPTION_KEY/));
});
