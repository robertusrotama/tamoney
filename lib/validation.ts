import { z } from "zod";
import { parseRupiah } from "./money";

const MAX_AMOUNT = 1_000_000_000_000;

const rupiah = (min: number) =>
  z.union([z.string(), z.number()]).transform((v, ctx) => {
    const n = typeof v === "number" ? v : parseRupiah(v);
    if (n === null || !Number.isInteger(n) || n < min || n > MAX_AMOUNT) {
      ctx.addIssue({ code: "custom", message: "Nominal tidak valid" });
      return z.NEVER;
    }
    return n;
  });

const id = z.uuid({ error: "Pilihan tidak valid" });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Tanggal tidak valid" });
const note = z
  .string()
  .trim()
  .max(200, { error: "Catatan maksimal 200 karakter" })
  .optional()
  .transform((v) => v || null);

export const txSchema = z.object({
  kind: z.enum(["income", "expense"]),
  amount: rupiah(1),
  wallet_id: id,
  category_id: id,
  note,
  occurred_at: date,
});

export const transferSchema = z
  .object({ amount: rupiah(1), wallet_id: id, to_wallet_id: id, note, occurred_at: date })
  .refine((t) => t.wallet_id !== t.to_wallet_id, {
    error: "Dompet asal dan tujuan harus berbeda",
    path: ["to_wallet_id"],
  });

export const walletSchema = z.object({
  name: z.string().trim().min(1, { error: "Nama dompet wajib diisi" }).max(50, { error: "Nama maksimal 50 karakter" }),
  type: z.enum(["cash", "bank", "ewallet", "credit", "other"]),
  initial_balance: z.union([z.literal("").transform(() => 0), rupiah(0)]),
  // Keys mirror components/wallets/style.ts; "" = default for the wallet type
  color: z
    .enum(["", "blue", "indigo", "purple", "pink", "red", "orange", "yellow", "green", "teal", "graphite"])
    .optional()
    .transform((v) => v || null),
  pattern: z
    .enum(["", "plain", "mesh", "lines", "waves", "rings"])
    .optional()
    .transform((v) => v || null),
});

export const salarySchema = z
  .object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, { error: "Bulan tidak valid" }),
    amount: rupiah(1),
    wallet_id: id,
    occurred_at: date,
    alloc: z.record(id, rupiah(0)),
  })
  .refine((s) => Object.values(s.alloc).reduce((a, b) => a + b, 0) === s.amount, {
    error: "Total alokasi harus sama dengan gaji",
    path: ["alloc"],
  });

const pos = z.object({
  id: id.nullable(),
  name: z.string().trim().min(1, { error: "Nama pos wajib diisi" }).max(40, { error: "Nama pos maksimal 40 karakter" }),
  icon: z.string().min(1).max(40),
  pct_bp: z.number().int().min(0, { error: "Persentase tidak valid" }).max(10_000, { error: "Persentase tidak valid" }),
  is_savings: z.boolean(),
  category_ids: z.array(id),
});

export const budgetSettingsSchema = z
  .object({ payday: z.number().int().min(1).max(28, { error: "Tanggal gajian 1–28" }), groups: z.array(pos).min(1) })
  .refine((s) => s.groups.filter((g) => g.is_savings).length === 1, { error: "Harus ada tepat satu pos Tabungan" })
  .refine((s) => s.groups.reduce((a, g) => a + g.pct_bp, 0) === 10_000, { error: "Total persentase harus 100%" })
  .refine((s) => new Set(s.groups.map((g) => g.name.toLowerCase())).size === s.groups.length, { error: "Nama pos tidak boleh sama" })
  .refine((s) => {
    const all = s.groups.flatMap((g) => g.category_ids);
    return new Set(all).size === all.length;
  }, { error: "Satu kategori hanya boleh di satu pos" });

/** First validation message, for showing in a form. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Data tidak valid";
}
