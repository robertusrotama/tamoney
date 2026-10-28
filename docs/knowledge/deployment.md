---
title: Deployment
tags: [tamoney, deployment, supabase, vercel]
updated: 2026-10-29
---

# Deployment

| | |
|---|---|
| **Production** | https://tamoney.vercel.app |
| **Vercel project** | `tamoney` (dihubungkan via `vercel link`, `.vercel/` di-gitignore) |
| **Supabase project** | `lunelnmwgcccapnjolht` (eu-west-1, Postgres 17) |
| **Supabase MCP** | `.mcp.json` (scope project) — autentikasi lewat `/mcp` |

## Env vars

| Nama | Isi |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lunelnmwgcccapnjolht.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key (`sb_publishable_…`) — aman di browser |

Sudah diset di Vercel untuk production, preview, development. Lokal: `.env.local` (gitignored; juga berisi akun uji `TEST_USER_EMAIL/PASSWORD` untuk smoke test lokal). Tidak ada service role key di app.

## Migrasi

File di `supabase/migrations/`, diterapkan lewat Supabase MCP `apply_migration`:

1. `20261029000000_init.sql` — skema, RLS (`to authenticated`), grant, view saldo, trigger signup
2. `20261029010000_owner_scoped_fks.sql` — FK komposit `(id, user_id)` agar transaksi tidak bisa menunjuk dompet/kategori user lain
3. `20261029020000_fk_indexes.sql` — index untuk FK komposit

Setelah perubahan skema: jalankan advisor (MCP `get_advisors` security + performance). Lihat [[database]].

## Supabase Auth — URL Configuration (wajib, lewat dashboard)

Authentication → URL Configuration:
- **Site URL:** `https://tamoney.vercel.app`
- **Redirect URLs:** `https://tamoney.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`

Tanpa ini, link verifikasi email & reset password mengarah ke `localhost:3000`.

## Deploy ulang

`npx vercel deploy --prod` (atau hubungkan repo GitHub di Vercel untuk auto-deploy).

## Log

`npx vercel logs --deployment tamoney.vercel.app --query 'level:error'` (plan Hobby: retensi 30 menit).

Lihat [[architecture]], [[database]].
