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
| `profiles` | `id` (= auth.users.id), `display_name`, `currency` default `IDR`, `payday_day` (1–28, default 25), `avatar` (emoji) + `avatar_color` |
| `wallets` | `name` (≤ 50), `type` `cash\|bank\|ewallet\|credit\|other`, `initial_balance bigint`, `archived_at`, `color`/`pattern` (tampilan kartu, opsional, dibatasi check constraint) |
| `categories` | `kind` `income\|expense`, `name`, `icon` (Material Symbol); unik `(user_id, kind, name)` |
| `transactions` | `kind` `income\|expense\|transfer`, `amount bigint` (> 0, ≤ 1e12), `wallet_id`, `to_wallet_id`, `category_id`, `note` (≤ 200), `occurred_at`, `goal_id` (hanya transfer), `bill_id` (hanya expense) |
| `budget_groups` | Pos budget: `name`, `icon`, `pct_bp` (basis poin, total 10000 dijaga app), `is_savings` (tepat satu per user), `sort`. `categories.budget_group_id` → pos |
| `budget_periods` | Satu per gaji: `month` (tgl 1, unik per user), `start_date`, `salary`, `income_tx_id` |
| `budget_allocations` | `(period_id, group_id)` → `amount`; disalin per periode |
| `goals` | `target`, `initial_amount`, `due_date?`, `monthly_amount?`, `wallet_id` (tempat uang), `source_wallet_id?`, `achieved_at`, `archived_at` |
| `bills` | `amount` (perkiraan), `category_id`, `wallet_id`, `cadence` `weekly\|monthly\|yearly`, `due_day`, `next_due`, `remind_days` (0–14), `archived_at` |

Aturan `transactions`:
- `transfer` ⇒ `to_wallet_id` wajib & ≠ `wallet_id`, `category_id` null.
- `income`/`expense` ⇒ `category_id` wajib, `to_wallet_id` null. Kesesuaian jenis kategori dicek di server action.
- FK wallet `on delete restrict` — lihat [[wallet-archive-not-delete]].
- Index `(user_id, occurred_at desc)`.

## Pintasan iPhone (API token)

- `api_tokens`: `name`, `token_hash` (sha256 hex, unik), `last_used_at`. Token asli (`tm_…`, 32 byte acak) hanya ditampilkan sekali; RLS milik sendiri.
- `pintasan_add(p_token, p_kind, p_categories[], p_wallets[], p_amount, p_note)` — SECURITY DEFINER, **hanya anon** (Shortcut tidak punya sesi; token adalah kredensialnya). Advisor 0028 sengaja diterima. Semua baris yang disentuh dibatasi ke pemilik token. Sumber "Credit Card" → dompet bernama "Kartu Kredit", atau bila tidak ada → dompet aktif pertama berjenis `credit`. Lihat [[pintasan-iphone]].

## Budget, tagihan, goals (RPC)

Semua `security invoker` (RLS tetap berlaku), `execute` hanya `authenticated`:
- `record_salary(month, salary, wallet, occurred_at, allocations jsonb)` — transaksi gaji + periode + alokasi secara atomik; bulan yang sama = update, bukan duplikat. Total alokasi ≠ gaji → error.
- `pay_bill(bill, due, amount, wallet, occurred_at)` — catat pengeluaran + majukan `next_due`. `due` = tanggal yang dilihat user; kalau sudah maju → "tagihan sudah dibayar" (anti dobel tap).
- `skip_bill(bill, due)` — majukan tanpa transaksi.
- `bill_next_due()` — kembaran SQL dari `nextDue()` di `lib/bills.ts` (tgl 31 → akhir bulan pendek → kembali 31).
- `seed_budget(uid)` (definer, tak bisa dipanggil) — kategori Groceries/Kost & Rumah/Langganan + 11 pos default; dipanggil `handle_new_user`.

Lihat [[budget-payday-pos]], [[goals-via-transfers]].

## View `wallet_balances`

`security_invoker = true`. Saldo = `initial_balance + Σincome − Σexpense − Σtransfer keluar + Σtransfer masuk`. Lihat [[balance-from-view]].

## Trigger signup

`handle_new_user()` (security definer) pada insert `auth.users`: buat `profiles` (nama dari `raw_user_meta_data.display_name`) + kategori bawaan:

- **Pengeluaran:** Makan & Minum (`restaurant`), Transportasi (`directions_car`), Belanja (`shopping_bag`), Tagihan & Utilitas (`bolt`), Hiburan (`movie`), Kesehatan (`medical_services`), Lainnya (`more_horiz`)
- **Pemasukan:** Gaji (`payments`), Bonus (`redeem`), Hasil Investasi (`trending_up`), Lainnya (`more_horiz`)

Uang: [[money-bigint-rupiah]].
