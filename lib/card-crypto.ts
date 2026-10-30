import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Card details at rest: AES-256-GCM, random 96-bit IV per write, auth tag checked on read.
// The key lives only in the server env (CARD_ENCRYPTION_KEY, 32 bytes base64) — never in the DB or the browser.
// Server code only: import from server actions, never from a "use client" module.

export type CardData = { number: string; expiry: string; holder: string };

const b64 = (b: Buffer) => b.toString("base64url");
function key(raw = process.env.CARD_ENCRYPTION_KEY) {
  const k = raw ? Buffer.from(raw, "base64") : null;
  if (!k || k.length !== 32) throw new Error("CARD_ENCRYPTION_KEY must be 32 bytes, base64");
  return k;
}

/** "v1.<iv>.<tag>.<ciphertext>" (base64url parts). */
export function encryptCard(data: CardData, rawKey?: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(rawKey), iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  return ["v1", b64(iv), b64(cipher.getAuthTag()), b64(ct)].join(".");
}

export function decryptCard(sealed: string, rawKey?: string): CardData {
  const [v, iv, tag, ct] = sealed.split(".");
  if (v !== "v1" || !iv || !tag || !ct) throw new Error("bad card ciphertext");
  const decipher = createDecipheriv("aes-256-gcm", key(rawKey), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8"));
}
