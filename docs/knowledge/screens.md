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
- Tab periode **Mingguan · Bulanan · Tahunan · Rentang** + ‹ label › (Rentang: kalender rentang kustom dengan preset 7/30/90 hari). Minggu = Senin–Minggu WIB. Perbandingan selalu vs periode sebelumnya yang sama panjang. Logika di `lib/period.ts` (dites).
- Search bar; filter **Kategori** & **Dompet** (checklist, bisa lebih dari 1) dan **Jenis** (pilih satu) — komponen sendiri (`components/ui/Popover.tsx`, `components/analytics/Filters.tsx`), bukan kontrol bawaan perangkat.
- Ringkasan Pemasukan · Pengeluaran · Selisih; **Riwayat** (kiri, dikelompokkan per hari saat urut Tanggal, urut Tanggal/Nominal/Nama) dan **Kategori** donut + peringkat (kanan, sticky) → deep dive.
- **Kinerja:** server hanya mengambil data periode (+ periode sebelumnya). Search, filter, urut, total, donut dihitung di klien (instan, tanpa request); state disinkron ke URL lewat `history.replaceState`. Ganti periode = navigasi dalam transition → tab langsung pindah + skeleton.

## Deep dive kategori → `/analitik/kategori/[id]`
- Mengikuti periode Analitik (tab yang sama). Ringkasan total, porsi, Δ vs periode sebelumnya, jumlah + rata-rata, transaksi terbesar.
- Grafik per **Hari / Minggu / Bulan**; pengelompokan **Harian · Mingguan · Bulanan · Semua** (default menyesuaikan panjang periode); filter cari + dompet; urut Tanggal/Nominal/Nama. Semua instan di klien.

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
