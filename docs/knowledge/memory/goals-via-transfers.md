---
title: goals-via-transfers
tags: [tamoney, memory]
type: decision
updated: 2026-10-29
---

Progres goal = `initial_amount` + Σ transfer ber-`goal_id` **masuk** ke dompet goal − Σ yang **keluar**; bukan saldo dompet. Satu dompet boleh dipakai beberapa goal. Kebutuhan setoran per periode = sisa ÷ jumlah payday dari periode berjalan sampai due date (dibulatkan ke atas Rp 1.000), dihitung dari tabungan sebelum setoran periode ini sehingga stabil selama satu periode.

**Why:** User ingin tahu uangnya ditaruh di mana (investasi/bank) dan saldo dompet tetap akurat (2026-10-29). Transfer tetap bukan pemasukan/pengeluaran ([[transfer-not-income-expense]]).

**How to apply:** `lib/goals.ts`; Setor/Tarik lewat `saveTransfer` dengan `goal_id` (dicek menyentuh dompet goal); `achieved_at` di `lib/goal-progress.ts`. Pos Tabungan di Budget menghitung setoran goal.
