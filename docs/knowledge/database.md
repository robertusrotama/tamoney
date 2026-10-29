---
title: Database
tags: [tamoney, database, supabase]
updated: 2026-10-29
---

# Database (Supabase Postgres)

Migrasi: `supabase/migrations/`. Semua tabel punya `user_id` dan **RLS** `user_id = auth.uid()` untuk select/insert/update/delete (`profiles` memakai `id`).

## Tabel

| Tabel | Kolom penting |
|---|---|
| `profiles` | `id` (= auth.users.id), `display_name`, `currency` default `IDR` |
| `wallets` | `name` (≤ 50), `type` `cash\|bank\|ewallet\|credit\|other`, `initial_balance bigint`, `archived_at`, `color`/`pattern` (tampilan kartu, opsional, dibatasi check constraint) |
| `categories` | `kind` `income\|expense`, `name`, `icon` (Material Symbol); unik `(user_id, kind, name)` |
| `transactions` | `kind` `income\|expense\|transfer`, `amount bigint` (> 0, ≤ 1e12), `wallet_id`, `to_wallet_id`, `category_id`, `note` (≤ 200), `occurred_at` |

Aturan `transactions`:
- `transfer` ⇒ `to_wallet_id` wajib & ≠ `wallet_id`, `category_id` null.
- `income`/`expense` ⇒ `category_id` wajib, `to_wallet_id` null. Kesesuaian jenis kategori dicek di server action.
- FK wallet `on delete restrict` — lihat [[wallet-archive-not-delete]].
- Index `(user_id, occurred_at desc)`.

## Pintasan iPhone (API token)

- `api_tokens`: `name`, `token_hash` (sha256 hex, unik), `last_used_at`. Token asli (`tm_…`, 32 byte acak) hanya ditampilkan sekali; RLS milik sendiri.
- `pintasan_add(p_token, p_kind, p_categories[], p_wallets[], p_amount, p_note)` — SECURITY DEFINER, **hanya anon** (Shortcut tidak punya sesi; token adalah kredensialnya). Advisor 0028 sengaja diterima. Semua baris yang disentuh dibatasi ke pemilik token. Sumber "Credit Card" → dompet bernama "Kartu Kredit", atau bila tidak ada → dompet aktif pertama berjenis `credit`. Lihat [[pintasan-iphone]].

## View `wallet_balances`

`security_invoker = true`. Saldo = `initial_balance + Σincome − Σexpense − Σtransfer keluar + Σtransfer masuk`. Lihat [[balance-from-view]].

## Trigger signup

`handle_new_user()` (security definer) pada insert `auth.users`: buat `profiles` (nama dari `raw_user_meta_data.display_name`) + kategori bawaan:

- **Pengeluaran:** Makan & Minum (`restaurant`), Transportasi (`directions_car`), Belanja (`shopping_bag`), Tagihan & Utilitas (`bolt`), Hiburan (`movie`), Kesehatan (`medical_services`), Lainnya (`more_horiz`)
- **Pemasukan:** Gaji (`payments`), Bonus (`redeem`), Hasil Investasi (`trending_up`), Lainnya (`more_horiz`)

Uang: [[money-bigint-rupiah]].
