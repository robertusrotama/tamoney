---
title: Design System
tags: [tamoney, design, apple]
updated: 2026-10-29
source: skill apple-design (.claude/skills/apple-design/) — WWDC "Designing Fluid Interfaces", HIG
---

# Design System

Gaya Apple (iOS/macOS) untuk web. Sumber prinsip: skill `apple-design`. Lihat [[apple-design-direction]] untuk alasan keputusan, [[screens]] untuk penerapan per halaman.

## Warna

Token semantik di `app/globals.css` (variabel `--c-*`, dipetakan ke kelas Tailwind lewat `@theme inline`). Terang/gelap otomatis via `prefers-color-scheme`.

| Token (kelas Tailwind) | Peran | Terang | Gelap |
|---|---|---|---|
| `primary` | Aksen (systemBlue) | `#007AFF` | `#0A84FF` |
| `positive` | Pemasukan (systemGreen, varian aksesibel) | `#248A3D` | `#30D158` |
| `negative` | Pengeluaran (systemRed, varian aksesibel) | `#D70015` | `#FF453A` |
| `tertiary` | Transfer (systemIndigo) | `#5856D6` | `#5E5CE6` |
| `surface` | Latar (systemGroupedBackground) | `#F2F2F7` | `#000000` |
| `card` | Kartu/list (secondarySystemGroupedBackground) | `#FFFFFF` | `#1C1C1E` |
| `surface-dim` | Fill: field, segmented control | rgba(118,118,128,.12) | .24 |
| `outline` | Separator hairline | rgba(60,60,67,.18) | rgba(84,84,88,.6) |
| `on-surface` / `on-surface-variant` | Label / secondaryLabel | `#000` / 60% | `#FFF` / 60% |

`*-container` = tint 12–20% dari warna dasarnya. Kartu dompet memakai gradien per jenis (`components/wallets/style.ts`): bank biru, e-wallet hijau, tunai oranye, lainnya abu.

## Tipografi

- Font sistem (`system-ui` → SF Pro di Apple) dengan `font-optical-sizing: auto`. Tidak ada webfont teks.
- Ikon: Material Symbols **Rounded** (paling dekat ke SF Symbols); `filled` untuk status aktif.
- Skala: large title 34px bold `-0.022em` (`.large-title`), judul seksi 20px bold, body 17px, subjudul/label 13px secondaryLabel.
- Tracking per ukuran: angka besar negatif (`-0.02`–`-0.03em`), body 0.
- Semua uang `tabular-nums`.

## Layout

- **Inset grouped** (gaya Settings): kartu `rounded-[14px] bg-card`, tanpa border/shadow; pemisahan lewat warna latar.
- Baris list (`TxRow` dalam `TxList`): tile ikon 32px `rounded-[8px]` warna solid, separator hairline mulai setelah ikon.
- Judul seksi di luar kartu, kiri, dengan aksi teks biru di kanan ("Kelola", "Semua").
- Field: fill abu `rounded-[10px]`, tinggi min 44px (target sentuh), ring biru saat fokus.

## Liquid Glass

Shell mengambang di atas konten (gaya iOS 26), dibuat dari bagian Materials skill apple-design (tidak ada skill liquid-glass terpisah):

- `.glass`: badan tipis translucent (gradien atas→bawah), `blur(14px) saturate(190%)`, rim spekular terang di atas (inset 1px), tepi halus, bayangan ambient dalam.
- `.glass.glass-thick`: untuk permukaan besar (popover bulan, menu akun): blur 40px + badan lebih padat agar teks di belakang tidak bersaing.
- `.glass-lens`: "lensa" yang menandai item aktif di sidebar/tab bar; berpindah dengan `layoutId`.
- Tooltip/chip kecil di atas konten terang: **solid** (`bg-card`), bukan glass, demi keterbacaan.
- Reduce transparency → solid.

Dipakai: sidebar mengambang (desktop), tab bar kapsul mengambang (mobile), kapsul header (Catat + akun), pemilih bulan.

### Sidebar
- Lebar 232px, ciut ke 64px lewat tombol `left_panel_close/open`. Status disimpan di cookie `sb_collapsed` (dibaca server → tidak ada lompatan saat load).
- Saat ciut, hover/fokus keyboard memunculkan label menu yang tumbuh dari ikon ke arah konten.
- Konten mengikuti lebar sidebar lewat CSS var `--sb` yang dianimasikan Motion; desktop full width (tanpa max-width).

## Material

- `.material` = `backdrop-filter: blur(20px) saturate(180%)` + latar semi transparan. Dipakai untuk sidebar, header, tab bar, menu akun. Konten menggulir di bawahnya.
- `prefers-reduced-transparency` → solid; `prefers-contrast: more` → solid + border kontras.
- Dialog/sheet: scrim gelap (tugas modal), panel solid.

## Motion (motion.dev, `motion/react`)

Konstanta di `components/ui/MotionProvider.tsx`:

| Nama | Nilai | Dipakai untuk |
|---|---|---|
| `SPRING` (default) | `bounce 0, duration 0.35` (damping 1.0) | Hampir semua: dialog, highlight nav, segmented |
| `SPRING_MOMENTUM` | `bounce 0.2, duration 0.4` | Hanya setelah gestur ber-momentum (sheet dilempar) |

- `MotionConfig reducedMotion="user"`: dengan reduce motion, transform dimatikan — tinggal fade.
- **Tekan:** `whileTap` scale 0.97 (tombol), 0.9 (ikon) — umpan balik saat pointer-down.
- **Sheet mobile** (`Dialog` < 768px): drag Y 1:1, elastic atas 0.05 (rubber-band), tutup bila `offset + project(velocity) > tinggi/2` dengan fungsi proyeksi Apple (`d = 0.998`).
- **Dialog desktop:** muncul dari posisi tombol pemicu (`useDialog().show(e)` → `origin`) dan kembali ke sana saat ditutup (jalur simetris).
- **Navigasi:** lensa item aktif sidebar & thumb segmented pindah dengan `layoutId`; hover item sidebar = **fade** latar (0.18s), tanpa geser.
- **Kontrol:** segmented & pill filter punya state hover, tekan (scale), fokus; popover tumbuh dari pemicunya, Esc/klik luar menutup.
- **Angka:** `Money` menganimasikan dari nilai di layar ke nilai baru (spring 0.6s).
- **Masuk list:** `FadeIn` opacity + 8px, stagger 30ms (maks 10 item).
- Hanya animasi `transform`/`opacity`.

## Komponen inti — wajib dipakai, tanpa kontrol bawaan perangkat

Tidak ada `<select>`, `<input type="date|month">`, `confirm()`/`alert()` atau tombol/field ad-hoc di halaman. Semua lewat `components/ui/`:

| Kebutuhan | Komponen | Catatan |
|---|---|---|
| Tombol | `Button` | variant `primary · tonal · ghost · outline · danger · destructive`; size `lg` (52px, CTA halaman/auth) · `md` (44px, form & dialog) · `sm` (32px, aksi baris). Jangan override tinggi lewat className. |
| Tombol ikon | `IconButton` | warna via `tone` `muted · primary · inherit` (inherit = di atas kartu berwarna). Jangan beri `text-*` lewat className — dua kelas warna saling bertabrakan. |
| Field teks | `Input`, `PasswordField` (toggle mata), `AmountInput` (Rp + titik ribuan), `SearchField` (tombol hapus sendiri) | semua memakai `fieldClass`: tinggi 48px, `rounded-[14px]`, fill abu, ring biru saat fokus. Label lewat `Field`. |
| Pilihan satu | `Picker` | pengganti `<select>`: tampil seperti Input, listbox glass, cari otomatis bila > 8 opsi, ↑/↓/Enter/Esc, nilai via input hidden. |
| Tanggal | `DateField` | pengganti `<input type="date">`: kalender glass (`MonthGrid`), tombol "Hari ini". Rentang: `RangeCalendar` (memakai `MonthGrid` yang sama). |
| Filter | `MultiSelect`, `SingleSelect` (`components/analytics/Filters.tsx`) di atas `Popover` | checklist / radio dengan tanda `Mark`. |
| Konfirmasi | `useConfirm()` | dialog sendiri (sheet di mobile); `destructive` untuk tindakan tak bisa dibatalkan. |
| Lainnya | `Segmented`, `Dialog` + `useDialog`, `Popover`, `Money`, `FadeIn`, `Card`/`Label`/`EmptyState`, `Bone`/`ListBones`, `Icon` | |

## Halaman auth
Layout terbelah (`app/(auth)/layout.tsx`): panel form kiri (pill logo, judul tengah + subjudul, field berlabel, tombol `lg`), panel visual kanan ≥1024px (`components/auth/AuthVisual.tsx`): kartu UI TaMoney melayang di atas mesh biru — muncul bertahap sekali, tanpa animasi berulang. Tanpa login sosial.
