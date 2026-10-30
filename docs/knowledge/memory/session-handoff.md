---
title: session-handoff
tags: [tamoney, memory, handoff]
type: handoff
updated: 2026-10-30
---

# Handoff — read this first in a new session

Ringkasan sesi panjang pembangunan TaMoney (Fase 1+2 → budget, tagihan, goals, dompet, UI). Detail teknis ada di [[architecture]], [[database]], [[screens]], [[design-system]], [[prd]].

## Cara kerja yang user mau
- **Bahasa obrolan:** Indonesia santai; jawab singkat. User suka mode hemat token → pakai skill **caveman** bila diminta ("caveman mode").
- **Skills:** Ponytail (`.claude/skills/ponytail`, perubahan terkecil), apple-design (`.claude/skills/apple-design`), superpowers (brainstorming → spec → plan → executing-plans untuk fitur besar; perubahan kecil langsung), supabase (migrasi via MCP project `lunelnmwgcccapnjolht`).
- **Alur:** fitur baru → desain singkat → user bilang "Approved, build it" → bangun → cek di browser (build produksi lokal port 3005, akun uji `smoke@tamoney.test`, password di `.env.local`) → commit per langkah.
- **Deploy hanya kalau user bilang "deploy"** (`npx --yes vercel@latest deploy --prod --yes`). Push GitHub hanya kalau diminta. Jangan login ke akun produksi user.
- Migrasi DB langsung ke DB bersama (prod) → harus kompatibel dengan kode lama (aditif). Hati-hati embed PostgREST ambigu (sudah pernah bikin prod error; pakai hint FK eksplisit).
- Commit diakhiri `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; prettier `--print-width 160`.

## Preferensi desain
- Apple / iOS look, Liquid Glass, Bahasa Indonesia, rupiah utuh, zona WIB.
- **Animasi pakai `motion/react`**, bukan CSS transition; spring tanpa bounce berlebih.
- **Semua kontrol custom** (tanpa select/date/confirm bawaan): Picker, DateField, Popover (melayang via portal, tidak bikin form scroll), Check, PillTabs, Segmented, Dialog (sheet di HP, drag hanya dari handle), useConfirm, AmountInput (animasi per digit), InfoTip.
- Fokus input: ring biru fade (komponen `Ring`). Tombol: kursor tangan; di desktop kursor gaya **iPadOS** (`PointerCursor`).
- Catat: tab pil — **Pengeluaran oranye, Pemasukan biru, Transfer hijau**, satu tab bar + crossfade + tinggi halus (`AutoHeight`).
- Filter/kontrol datar (tanpa shadow) bila diminta; filter tanggal gaya **Kibana** di samping search.
- Dompet: kantong kaca (glass pocket) per jenis dengan tumpukan kartu + modal kartu kaca; latar dot-grid.
- Tab bar HP: lens kaca bisa ditekan & digeser (iOS liquid glass), tap biasa tetap jalan.
- Loading awal: layar spinner + baris lucu ("Tunggu, lagi diitung duitnya…"); pindah menu: kartu muncul bertahap.

## Fitur yang sudah live (tamoney.vercel.app)
Auth (split-screen), Ringkasan (pengeluaran hari ini, kartu rencana), Budget gajian tgl 25 (pos %, edit/hapus gaji, drill-down pos, pemasukan bisa masuk budget), Rencana (Goals ↔ dompet, Tagihan rutin + Bayar), notifikasi panel, Dompet (jenis Investasi, edit saldo + riwayat, data kartu terenkripsi AES-256-GCM tanpa CVV, mata sembunyikan saldo), Analitik (filter Kibana, pagination desktop / show-more HP, deep dive kategori), Pengaturan (avatar emoji, ganti password, tema, halaman budget), Pintasan Siri, PWA, **Tagih ke teman** (checklist utang teman → notifikasi → "Sudah dibayar" catat pengembalian & kurangi pengeluaran).

## Perubahan terakhir (30 Okt 2026)
- iOS: sheet hanya bisa di-drag dari handle (form panjang bisa scroll — fix goal "freeze"); input ≥16px & search dropdown tidak autofocus di layar sentuh (fix zoom).
- Tagih ke teman: kolom `owed_amount/owed_note/owed_settled_at/reimburses_id` + RPC `settle_owed`; refund dihitung sebagai pengurang pengeluaran (`isRefund` di `lib/reports.ts`, `usage` di `lib/budget.ts`).
- Tab bar HP: lens transform-only + drag; tap biasa diperbaiki. Kursor iPadOS dipercepat.
- Semua sudah di-deploy dan di-push ke branch `feat/fase-1-2`. PR ke `master` disiapkan lewat link (gh CLI belum login).

## Belum selesai / catatan
- **i18n ID/EN ±50%**: inti (`lib/i18n.ts`, `lib/i18n-en.ts`, `useT`/`getT`, tes cakupan kunci) + shell, auth, Ringkasan, Dompet, transaksi, notifikasi. Sisa: Analitik, Budget, Rencana, Pengaturan, Pintasan + pemilih bahasa di Pengaturan → Tampilan.
- Minor dari review (ditunda): `record_salary` paralel bisa dobel income; edit goal men-stamp ulang `achieved_at`; tagihan terlambat bulan lalu tak masuk "tersisa bulan ini"; urutan tanggal gaji tidak divalidasi; query transfer goal tanpa paging; `deleteSalary` tidak atomik; edit transfer goal lewat form transfer biasa melewati cek dompet goal.
- iOS Simulator butuh Xcode penuh + `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
- Ledger eksekusi lama ada di `.superpowers/sdd/2026-10-29-budget-tagihan-goals/progress.md` (git-ignored).
