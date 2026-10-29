---
title: budget-payday-pos
tags: [tamoney, memory]
type: decision
updated: 2026-10-29
---

Budget dihitung per **periode gaji**, bukan bulan kalender: periode mulai di tanggal gaji dicatat dan berakhir sehari sebelum gaji berikutnya (gaji telat → periode lama memanjang). Gaji dibagi ke **pos** (1 pos = 1+ kategori) memakai basis poin; pos non-tabungan dibulatkan ke Rp 10.000 dan **sisa pembulatan masuk Tabungan**, jadi total selalu persis = gaji. Default dari analisis gaji Rp 12 jt (Tabungan 33,33% = 4 jt, Rumah & Kost 20%, Makanan 15%, …).

**Why:** User gajian tanggal 25 dan ingin menabung minimal 3–5 jt (2026-10-29). Alokasi disalin per periode supaya mengubah persen tidak menulis ulang bulan lalu.

**How to apply:** Logika di `lib/budget.ts` (`allocate`, `periodRange`, `usage`); persen diubah di [[screens]] Pengaturan; skema di [[database]].
