---
title: wallet-archive-not-delete
tags: [tamoney, memory]
type: decision
updated: 2026-10-29
---

Wallet tidak pernah dihapus, hanya diarsipkan (`archived_at`). Diarsipkan = hilang dari dropdown & total, transaksi lama tetap di riwayat dan bisa diedit.

**Why:** Menghapus wallet akan menghapus/merusak riwayat transaksi.

**How to apply:** FK `on delete restrict`; transaksi baru tidak boleh memakai wallet arsip.

Terkait: [[database]], [[screens]]
