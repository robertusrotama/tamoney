---
title: Screens
tags: [tamoney, design]
updated: 2026-10-29
---

# Screens

Semua layar memakai [[design-system]]. Shell: sidebar translucent 256px (≥ 768px) atau tab bar translucent + tombol `+` melayang (< 768px). Lihat [[mobile-fab-bottom-nav]].

## Ringkasan → `/`
- Large title: tanggal + sapaan WIB.
- Kartu hero: **Saldo total** (angka besar), masuk/keluar bulan ini, bar pengeluaran vs pemasukan.
- **Dompet**: kartu mini bergradien, geser horizontal.
- **Hari Ini**: list inset grouped.
- ≥ 1024px: kolom kanan sticky **Catat Cepat** (`TxForm`).
- Komponen: `app/(app)/page.tsx`, `TxRow`/`TxList`, `TxForm`.

## Analitik → `/analitik`
- Large title + pemilih bulan (pill).
- Satu kartu grouped: Pemasukan · Pengeluaran · Surplus/Defisit (+% vs bulan lalu).
- **Tren 6 Bulan** (bar, warna sistem) dan **Kategori** (donut + peringkat).
- **Riwayat**: cari + filter (GET form), list dengan edit/hapus, paginasi 20.
- Komponen: `app/(app)/analitik/page.tsx`, `components/analytics/*`, `TxActions`.

## Dompet → `/dompet`
- Large title + ringkasan total, tombol Tambah.
- Kartu dompet gaya Apple Wallet (gradien per jenis), ubah/arsipkan.
- **Riwayat Transfer** (list) dan **Pindah Saldo** (`TransferForm`).
- **Diarsipkan** dengan Pulihkan. Lihat [[wallet-archive-not-delete]].

## Auth → `/masuk`, `/daftar`, `/lupa-password`, `/reset-password`
- Ikon app + nama, kartu form tunggal.

## Belum dibangun
Tanya AI & Pengaturan (Fase 3–4). Lihat [[no-bank-sync-no-ai-yet]].
