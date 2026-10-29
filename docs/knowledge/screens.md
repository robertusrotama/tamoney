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
- Baris peringkat & irisan donut kategori → **deep dive kategori**.
- Komponen: `app/(app)/analitik/page.tsx`, `components/analytics/*`, `TxActions`.

## Deep dive kategori → `/analitik/kategori/[id]`
- Kembali ke Analitik, ikon + nama kategori, `MonthPicker`.
- Ringkasan: total bulan, porsi dari semua pengeluaran/pemasukan, Δ vs bulan lalu, jumlah transaksi + rata-rata, transaksi terbesar (lompat ke barisnya).
- Grafik **Per Hari** / **Per Minggu** (minggu = blok tanggal 1–7, 8–14, …, WIB); klik batang → gulir ke grupnya.
- Pengelompokan **Harian · Mingguan · Semua** dengan subtotal per grup; filter cari catatan + dompet; urut **Tanggal · Nominal · Nama** naik/turun. Semua state di URL (`kelompok`, `urut`, `arah`, `q`, `dompet`, `bulan`).
- Logika di `lib/drilldown.ts` (dites).

## Dompet → `/dompet`
- Large title + ringkasan total, tombol Tambah.
- **Stack kartu gaya Apple Wallet** (kiri di desktop, atas di mobile): kartu terpilih utuh di depan, sisanya tertumpuk menampilkan strip atas (ikon, nama, saldo). Klik kartu → maju ke depan dengan layout spring. Pilihan disimpan di `?dompet=<id>`.
- **Aktivitas dompet terpilih** (kanan): semua perubahan saldo (masuk, keluar, transfer masuk/keluar) dengan **saldo berjalan** per baris (`lib/activity.ts`), 50 terakhir + tautan ke Analitik terfilter.
- **Tampilan kartu** per dompet di dialog Ubah/Tambah: 10 warna + 5 motif (Polos, Mesh, Garis, Gelombang, Cincin) dengan preview langsung. Kolom `wallets.color`/`pattern`; null = warna bawaan per jenis. Definisi di `components/wallets/style.ts`.
- Transfer baru dibuat lewat **+ Catat → Transfer**.
- **Diarsipkan** dengan Pulihkan. Lihat [[wallet-archive-not-delete]].

## Auth → `/masuk`, `/daftar`, `/lupa-password`, `/reset-password`
- Ikon app + nama, kartu form tunggal.

## Belum dibangun
Tanya AI & Pengaturan (Fase 3–4). Lihat [[no-bank-sync-no-ai-yet]].
