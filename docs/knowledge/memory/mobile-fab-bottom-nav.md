---
title: mobile-fab-bottom-nav
tags: [tamoney, memory]
type: decision
updated: 2026-10-29
---

Di < 768px: sidebar → tab bar translucent (Ringkasan, Analitik, Dompet) + tombol `+` melayang di semua halaman app yang membuka Catat Singkat sebagai bottom sheet.

**Why:** PRD minta tombol cepat di HP; pola tab bar + sheet adalah pola iOS yang familiar.

**How to apply:** Dialog: modal di desktop, bottom sheet di mobile. Cek tiap layar di 375px tanpa scroll horizontal.

Terkait: [[design-system]], [[screens]]
