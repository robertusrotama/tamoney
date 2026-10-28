---
title: money-bigint-rupiah
tags: [tamoney, memory]
type: decision
updated: 2026-10-29
---

Uang disimpan sebagai `bigint` rupiah utuh (tanpa desimal), `number` di TypeScript, nominal valid 1 s/d 1.000.000.000.000. Tampil `Rp 1.250.000` dengan JetBrains Mono `tabular-nums`.

**Why:** IDR praktis tanpa sen; integer menghindari error floating point.

**How to apply:** Format/parse hanya lewat `lib/money.ts` (`formatRupiah`, `parseRupiah`).

Terkait: [[database]], [[design-system]]
