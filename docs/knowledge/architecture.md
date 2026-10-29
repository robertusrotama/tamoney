---
title: Architecture
tags: [tamoney, architecture]
updated: 2026-10-29
---

# Architecture

- **Next.js 16 App Router (TypeScript)** di Vercel.
  - Halaman = Server Components yang membaca Supabase langsung (`lib/queries.ts`).
  - Mutasi = Server Actions di `lib/actions/*` → validasi Zod (`lib/validation.ts`) → `revalidatePath("/", "layout")`. Return `ActionState = { error?: string; ok?: boolean }`.
  - Komponen interaktif (form, chart, filter) = Client Components kecil.
- **Auth:** Supabase Auth via `@supabase/ssr` (cookie). `proxy.ts` (nama baru middleware di Next 16) me-refresh sesi dan mengarahkan tamu ke `/masuk`. `app/auth/callback/route.ts` menukar kode email (verifikasi & reset password).
- **Keamanan:** RLS di semua tabel ([[database]]); hanya anon key di klien; server action juga cek kepemilikan wallet & kategori.
- **Logika angka** di fungsi murni yang dites Vitest: `lib/money.ts` ([[money-bigint-rupiah]]), `lib/reports.ts` ([[timezone-wib]], [[transfer-not-income-expense]]).
- **Styling:** Tailwind 4 dengan token warna Apple (terang/gelap) dari [[design-system]]. Motion: `motion/react` (motion.dev), spring default di `components/ui/MotionProvider.tsx`. Chart: Recharts.

## Struktur folder

```
app/
  (auth)/masuk, daftar, lupa-password, reset-password
  (app)/layout.tsx      sidebar + bottom nav + FAB
  (app)/page.tsx        Dashboard
  (app)/analitik, (app)/dompet
  auth/callback/route.ts
components/             per fitur (shell, ui, dashboard, transactions, analytics, wallets)
lib/
  supabase/             server.ts, client.ts, proxy.ts
  actions/              auth, wallets, transfers, transactions
  money.ts, reports.ts, validation.ts, queries.ts, types.ts
supabase/migrations/    skema SQL
docs/knowledge/         vault ini
```

## Perintah

`npm run dev` · `npm test` · `npm run build`
