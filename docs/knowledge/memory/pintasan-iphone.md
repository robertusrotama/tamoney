---
title: pintasan-iphone
tags: [tamoney, memory]
type: decision
updated: 2026-10-29
---

iPhone Shortcut (Back Tap → AI parse → Split) mengirim transaksi ke `POST /api/pintasan` dengan header `Authorization: Bearer tm_…` dan body JSON `{tipe, kategori, jumlah, sumber, text}`. Menggantikan Google Apps Script/Sheets.

**Why:** User mencatat lewat Shortcut; data harus masuk ke database TaMoney (2026-10-29).

**How to apply:** Token dibuat di halaman `/pintasan` (per akun). Mapping kategori/dompet di `lib/pintasan.ts` (Food→Makan & Minum, Credit Card→Kartu Kredit, Cash→Tunai, Unknown→Lainnya; kategori tak dikenal → Lainnya; dompet tak dikenal → 422 dengan daftar dompet). Balasan teks polos untuk notifikasi iPhone. Lihat [[database]].
