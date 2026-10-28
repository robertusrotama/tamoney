---
title: mobile-fab-bottom-nav
tags: [tamoney, memory]
type: decision
updated: 2026-10-29
---

Di < 768px: sidebar → bottom nav (Dashboard, Analitik, Dompet) + tombol `+` melayang di semua halaman app yang membuka Catat Singkat sebagai bottom sheet.

**Why:** PRD minta tombol cepat di HP; Stitch hanya punya layar desktop.

**How to apply:** Dialog: modal di desktop, bottom sheet di mobile. Cek tiap layar di 375px tanpa scroll horizontal.

Terkait: [[design-system]], [[screens]]
