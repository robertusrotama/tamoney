---
title: notifications-derived
tags: [tamoney, memory]
type: decision
updated: 2026-10-29
---

Notifikasi **diturunkan dari data** setiap render (`buildNotifications` di `lib/notifications.ts`), tanpa tabel, tanpa status "sudah dibaca", tanpa push/cron. Item hilang sendiri saat kondisinya selesai (tagihan dibayar, gaji dicatat, setoran cukup).

**Why:** User memilih panel in-app dulu (2026-10-29); push PWA butuh service worker, VAPID, dan cron — bisa ditambah nanti.

**How to apply:** Data dari `getPlanningState` (cache per request, dipakai layout + Budget + Rencana + Ringkasan). Tambah jenis baru di `NoticeKind` + urutan `ORDER`. Lihat [[screens]].
