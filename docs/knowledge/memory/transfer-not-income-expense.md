---
title: transfer-not-income-expense
tags: [tamoney, memory]
type: decision
updated: 2026-10-29
---

Transfer antar dompet adalah `kind = transfer` dengan `wallet_id` (dari) dan `to_wallet_id` (ke), tanpa kategori. Tidak pernah dihitung sebagai pemasukan/pengeluaran.

**Why:** Pindah uang sendiri bukan arus kas.

**How to apply:** Semua agregasi di `lib/reports.ts` mengabaikan transfer; saldo wallet tetap memperhitungkannya.

Terkait: [[balance-from-view]], [[database]]
