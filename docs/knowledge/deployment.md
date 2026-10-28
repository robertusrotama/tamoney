---
title: Deployment
tags: [tamoney, deployment, supabase, vercel]
updated: 2026-10-29
---

# Deployment

## Env vars

| Nama | Isi |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable key |

Lokal: salin `.env.example` → `.env.local`. Tidak ada service role key di app.

## Supabase

1. Buat project di supabase.com (gratis).
2. `npx supabase login` → `npx supabase link --project-ref <ref>` → `npx supabase db push`.
3. Auth → URL Configuration: Site URL = domain Vercel; Redirect URLs: `https://<domain>/auth/callback`, `http://localhost:3000/auth/callback`.

## Vercel

1. Push repo ke GitHub.
2. `npx vercel login` → `npx vercel link`.
3. `npx vercel env add NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production + preview).
4. `npx vercel --prod`.

## Smoke test

Daftar → verifikasi email → buat dompet → catat transaksi → cek analitik. Akun kedua tidak boleh melihat data akun pertama.

Lihat [[architecture]], [[database]].
