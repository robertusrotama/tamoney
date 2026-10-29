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
- Khusus **kelola dompet** (tambah, ubah, tampilan, arsip, pulihkan). Mencari transaksi dilakukan di Analitik: kartu depan punya tombol **Lihat transaksi** → `/analitik?dompet=<id>`.
- Atas: **Saldo total** (semua dompet aktif) + tombol Tambah.
- **Satu stack per jenis**, berjajar ke kanan: Bank · E-Wallet · Kartu Kredit · Tunai · Lainnya (hanya jenis yang ada), tiap kolom dengan jumlah & subtotal; bergulir horizontal (snap) bila tidak muat. Di dalam stack: kartu depan utuh (ubah, arsip, lihat transaksi), sisanya tertumpuk; klik → maju ke depan (layout spring, state lokal per stack).
- **Tampilan kartu** per dompet di dialog Ubah/Tambah: 10 warna + 5 motif dengan preview langsung (`components/wallets/style.ts`).
- **Diarsipkan** di bawah dengan Pulihkan. Lihat [[wallet-archive-not-delete]].

## Auth → `/masuk`, `/daftar`, `/lupa-password`, `/reset-password`
- Ikon app + nama, kartu form tunggal.

## Belum dibangun
Tanya AI & Pengaturan (Fase 3–4). Lihat [[no-bank-sync-no-ai-yet]].
