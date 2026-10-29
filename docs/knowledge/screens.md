---
title: Screens
tags: [tamoney, design]
updated: 2026-10-29
---

# Screens

Semua layar memakai [[design-system]]. Shell: sidebar Liquid Glass mengambang & bisa diciutkan (≥ 768px) atau tab bar kapsul mengambang + tombol `+` (< 768px). Lihat [[mobile-fab-bottom-nav]].

## Ringkasan → `/`
- Large title: tanggal + sapaan WIB.
- Kartu hero: **Saldo total** (angka besar), masuk/keluar bulan ini, bar pengeluaran vs pemasukan.
- **Dompet**: kartu mini bergradien, geser horizontal.
- **Hari Ini**: list inset grouped.
- ≥ 1024px: kolom kanan sticky **Catat Cepat** (`TxForm`).
- **+ Catat** (header/FAB) punya 3 tab: Pengeluaran · Pemasukan · Transfer (transfer hanya saat membuat baru).
- Komponen: `app/(app)/page.tsx`, `TxRow`/`TxList`, `TxForm`.

## Analitik → `/analitik`
- Large title + `MonthPicker` (‹ bulan › + popover grid bulan; tanpa `<input type="month">` yang tidak didukung Safari/Firefox desktop).
- Satu kartu grouped: Pemasukan · Pengeluaran · Surplus/Defisit (+% vs bulan lalu).
- **Tren 6 Bulan** (bar, warna sistem) dan **Kategori** (donut + peringkat).
- **Riwayat**: cari + filter (GET form), list dengan edit/hapus, paginasi 20.
- Komponen: `app/(app)/analitik/page.tsx`, `components/analytics/*`, `TxActions`.

## Dompet → `/dompet`
- Large title + ringkasan total, tombol Tambah.
- Kartu dompet gaya Apple Wallet (gradien per jenis), ubah/arsipkan.
- **Riwayat Transfer** (list). Transfer baru dibuat lewat **+ Catat → Transfer**.
- **Diarsipkan** dengan Pulihkan. Lihat [[wallet-archive-not-delete]].

## Auth → `/masuk`, `/daftar`, `/lupa-password`, `/reset-password`
- Ikon app + nama, kartu form tunggal.

## Belum dibangun
Tanya AI & Pengaturan (Fase 3–4). Lihat [[no-bank-sync-no-ai-yet]].
