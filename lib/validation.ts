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
  /** Current balance; new wallets start here, edits log an adjustment (set_wallet_balance). */
  balance: z.union([z.literal("").transform(() => 0), rupiah(0)]),
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

const name = (max: number, what: string) =>
  z.string().trim().min(1, { error: `Nama ${what} wajib diisi` }).max(max, { error: `Nama maksimal ${max} karakter` });

export const billSchema = z.object({
  name: name(50, "tagihan"),
  icon: z.string().min(1).max(40),
  amount: rupiah(1),
  category_id: id,
  wallet_id: id,
  cadence: z.enum(["weekly", "monthly", "yearly"]),
  next_due: date,
  remind_days: z.coerce.number().int().min(0, { error: "Pengingat 0–14 hari" }).max(14, { error: "Pengingat 0–14 hari" }).default(3),
});

export const payBillSchema = z.object({ bill_id: id, due: date, amount: rupiah(1), wallet_id: id, occurred_at: date });

const optional = <T extends z.ZodType>(schema: T) => z.union([z.literal("").transform(() => null), schema]).optional().transform((v) => v ?? null);

export const goalSchema = z
  .object({
    name: name(50, "goal"),
    icon: z.string().min(1).max(40),
    target: rupiah(1),
    initial_amount: z.union([z.literal("").transform(() => 0), rupiah(0)]).default(0),
    due_date: optional(date),
    monthly_amount: optional(rupiah(1)),
    wallet_id: id,
    source_wallet_id: optional(id),
  })
  .refine((g) => g.due_date || g.monthly_amount, { error: "Isi due date atau setoran bulanan", path: ["monthly_amount"] })
  .refine((g) => g.wallet_id !== g.source_wallet_id, { error: "Dompet sumber dan tujuan harus berbeda", path: ["source_wallet_id"] });

export const AVATAR_COLORS = ["blue", "indigo", "purple", "pink", "red", "orange", "yellow", "green", "teal", "graphite"] as const;

export const profileSchema = z.object({
  display_name: name(50, "tampilan"),
  avatar: z.string().max(16).optional().transform((v) => v || null),
  avatar_color: z.union([z.literal(""), z.enum(AVATAR_COLORS)]).optional().transform((v) => v || null),
});

export const passwordSchema = z
  .object({
    current: z.string().min(1, { error: "Isi password saat ini" }),
    password: z.string().min(8, { error: "Password minimal 8 karakter" }),
    confirm: z.string(),
  })
  .refine((p) => p.password === p.confirm, { error: "Konfirmasi password tidak sama", path: ["confirm"] })
  .refine((p) => p.password !== p.current, { error: "Password baru harus berbeda", path: ["password"] });

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

/** Luhn checksum — catches a mistyped card number. */
const luhn = (n: string) =>
  [...n].reverse().reduce((sum, ch, i) => {
    const d = Number(ch) * (i % 2 ? 2 : 1);
    return sum + (d > 9 ? d - 9 : d);
  }, 0) % 10 === 0;

/** Card details (bank/credit wallets). CVV is deliberately not accepted. */
export const cardSchema = z
  .object({
    card_number: z.string().transform((v) => v.replace(/[\s-]/g, "")),
    card_expiry: z.string().trim().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { error: "Masa berlaku format BB/TT" }),
    card_holder: z.string().trim().max(40, { error: "Nama pemilik maksimal 40 karakter" }).transform((v) => v.toUpperCase()),
  })
  .refine((c) => /^\d{12,19}$/.test(c.card_number) && luhn(c.card_number), { error: "Nomor kartu tidak valid", path: ["card_number"] })
  .transform((c) => ({ number: c.card_number, expiry: c.card_expiry, holder: c.card_holder }));

/** First validation message, for showing in a form. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Data tidak valid";
}
