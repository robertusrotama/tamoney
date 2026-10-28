---
title: timezone-wib
tags: [tamoney, memory]
type: decision
updated: 2026-10-29
---

Pengelompokan hari & bulan memakai zona waktu `Asia/Jakarta` (UTC+7, tanpa DST).

**Why:** User di Indonesia; transaksi 23:30 WIB harus masuk hari itu.

**How to apply:** Pakai helper `wibDate`, `monthKey`, `monthRange` di `lib/reports.ts`; jangan pakai tanggal UTC mentah.

Terkait: [[architecture]]
