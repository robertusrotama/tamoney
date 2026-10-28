---
title: Screens
tags: [tamoney, design, stitch]
updated: 2026-10-29
---

# Screens

Layar dari Stitch project "TaMoney Design" (lihat [[stitch-project-source]]) dan pemetaannya ke kode. HTML asli ada di `stitch/*.html`. Token & aturan: [[design-system]].

## Dashboard Utama & Catat Transaksi → `/`

![[dashboard-catat.png]]

- **Dibangun:** sapaan + tanggal, kartu Saldo Total / Pemasukan / Pengeluaran bulan ini, strip dompet, Aktivitas Hari Ini, panel Catat Singkat (toggle jenis, chip 20rb–500rb, nominal, dompet, kategori, catatan, tanggal).
- **Dihilangkan:** Sisa Anggaran, peringatan anggaran AI, Wawasan Cerdas, "Unduh PDF", status sinkronisasi bank.
- Komponen: `components/dashboard/*`, `components/transactions/TxForm.tsx`.

## Analitik & Riwayat Transaksi → `/analitik`

![[analitik-riwayat.png]]

- **Dibangun:** pilih bulan, kartu Pemasukan / Pengeluaran / Selisih (+% vs bulan lalu), tren 6 bulan (bar), porsi kategori (donut) + peringkat + delta, tabel riwayat dengan cari, filter dompet/kategori/jenis, edit, hapus, paginasi 20.
- **Dihilangkan:** Ekspor Data, Sinkronisasi, rata-rata tingkat tabungan.
- Komponen: `components/analytics/*`.

## Kelola Dompet & Rekening → `/dompet`

![[dompet.png]]

- **Dibangun:** ringkasan total & jumlah dompet, kartu dompet (ubah, arsipkan), tambah dompet, transfer antar dompet + log, daftar diarsipkan + pulihkan.
- **Dihilangkan:** nomor rekening, biaya admin, Integrasi Finansial Terbuka, Wawasan Cerdas, seret untuk urutkan, hapus permanen.
- Komponen: `components/wallets/*`. Lihat [[wallet-archive-not-delete]], [[transfer-not-income-expense]].

## Tanya AI & Pengaturan → belum

![[ai-pengaturan.png]]

Fase 3–4. Menu disembunyikan. Lihat [[no-bank-sync-no-ai-yet]].

## Mobile

Tidak ada layar mobile di Stitch; diturunkan dari desktop. Lihat [[mobile-fab-bottom-nav]].
