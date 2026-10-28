---
title: balance-from-view
tags: [tamoney, memory]
type: decision
updated: 2026-10-29
---

Saldo wallet tidak disimpan; dihitung oleh view `wallet_balances` dari saldo awal + transaksi.

**Why:** Saldo tersimpan bisa melenceng dari transaksi; view selalu benar.

**How to apply:** Baca saldo dari view. Jangan menambah kolom `balance` di `wallets`.

Terkait: [[database]], [[transfer-not-income-expense]]
