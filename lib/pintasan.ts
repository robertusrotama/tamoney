import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { parseRupiah } from "./money";

// The iPhone Shortcut's AI step speaks English categories and the user's own source names.
const CATEGORY: Record<string, string> = {
  food: "Makan & Minum",
  transportation: "Transportasi",
  bills: "Tagihan & Utilitas",
  health: "Kesehatan",
  shopping: "Belanja",
  entertainment: "Hiburan",
  others: "Lainnya",
  salary: "Gaji",
  bibit: "Investasi",
  tarik: "Tarik Tunai",
  transfer: "Lainnya",
};
const WALLET: Record<string, string> = {
  "credit card": "Kartu Kredit",
  cash: "Tunai",
  unknown: "Lainnya",
};

const candidates = (value: string, aliases: Record<string, string>) => {
  const v = value.trim().toLowerCase();
  return [...new Set([aliases[v]?.toLowerCase(), v].filter((x): x is string => !!x))];
};

/** Lower-cased names to try, best match first; the database falls back to "Lainnya". */
export const categoryCandidates = (kategori: string) => candidates(kategori, CATEGORY);
/** Lower-cased wallet names to try, best match first. */
export const walletCandidates = (sumber: string) => candidates(sumber, WALLET);

export function mapKind(tipe: string): "income" | "expense" | null {
  const t = tipe.trim().toLowerCase();
  if (t === "expense" || t === "pengeluaran") return "expense";
  if (t === "income" || t === "pemasukan" || t === "transfer") return "income";
  return null;
}

const schema = z.object({
  tipe: z.string(),
  kategori: z.string().default(""),
  jumlah: z.union([z.string(), z.number()]),
  sumber: z.string().trim().min(1, { error: "Sumber dana wajib diisi" }),
  text: z.string().optional(),
});

export type PintasanInput = { kind: "income" | "expense"; kategori: string; amount: number; sumber: string; note: string | null };

/** Validate the Shortcut's JSON body; error messages are shown in the iPhone notification. */
export function parsePintasan(body: unknown): { success: true; data: PintasanInput } | { success: false; error: string } {
  const r = schema.safeParse(body);
  if (!r.success) return { success: false, error: r.error.issues[0]?.path[0] === "sumber" ? r.error.issues[0].message : "Data tidak lengkap" };
  const kind = mapKind(r.data.tipe);
  if (!kind) return { success: false, error: "Tipe harus Expense atau Income" };
  const amount = typeof r.data.jumlah === "number" ? r.data.jumlah : parseRupiah(r.data.jumlah);
  if (amount === null || !Number.isInteger(amount) || amount < 1 || amount > 1_000_000_000_000) {
    return { success: false, error: "Nominal tidak valid" };
  }
  const note = r.data.text?.trim().slice(0, 200) || null;
  return { success: true, data: { kind, kategori: r.data.kategori, amount, sumber: r.data.sumber, note } };
}

/** 32 random bytes, URL-safe; shown to the user once. */
export const newToken = () => `tm_${randomBytes(32).toString("base64url")}`;
/** Only the hash is stored; Postgres checks with encode(digest(token, 'sha256'), 'hex'). */
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
