---
title: performance-region
tags: [tamoney, memory]
type: decision
updated: 2026-10-29
---

Server Vercel dijalankan di region **dub1 (Dublin)** lewat `vercel.json`, karena database Supabase ada di **eu-west-1 (Irlandia)**. Sebelumnya default **iad1 (Washington)** → tiap query menyeberang Atlantik (~75 ms) dan satu halaman butuh ~6 round trip berurutan.

**Why:** Halaman terasa lambat (2026-10-29). `x-vercel-id: sin1::iad1` menunjukkan masuk lewat Singapura tapi fungsi di AS.

**How to apply:**
- Fungsi server harus satu region dengan database. Jika database dipindah, ubah `regions` di `vercel.json` ikut.
- Verifikasi login pakai `supabase.auth.getClaims()` (JWT ES256 diverifikasi lokal), bukan `getUser()` yang memanggil server Auth.
- `requireUser`, `getWallets`, `getCategories` dibungkus React `cache()` agar layout & halaman tidak query dua kali.
- Peningkatan terbesar berikutnya: project Supabase baru di **ap-southeast-1 (Singapura)** + `regions: ["sin1"]` — paling dekat ke pengguna di Indonesia (butuh migrasi data).

Terkait: [[architecture]], [[deployment]]
