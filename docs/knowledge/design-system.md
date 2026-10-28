---
title: Design System
tags: [tamoney, design, stitch]
updated: 2026-10-29
source: Stitch project "TaMoney Design" (projects/15030374646572842565)
---

# Design System

Diambil dari design system Stitch project **TaMoney Design** ("Modern Financial Operating System"). Implementasi token ada di `app/globals.css` (blok `@theme` Tailwind 4). Layar referensi: [[screens]].

> [!note] Dua set warna
> Token YAML di bawah adalah palet Material yang di-generate Stitch. Bagian **Colors** di prosa adalah palet yang dipakai di HTML Stitch dan yang **dipakai di kode** (primary `#1E3A8A`, positive `#059669`, negative `#E11D48`, tertiary `#6366F1`, surface `#F8FAFC`).

## Penyesuaian TaMoney

- Nama produk **TaMoney** — semua "FinFlow" di desain diganti. Lihat [[brand-tamoney]].
- **Mobile (< 768px):** sidebar diganti bottom nav (Dashboard, Analitik, Dompet) + tombol `+` melayang (FAB) yang membuka form Catat Singkat sebagai bottom sheet. Dialog di desktop = modal tengah. Lihat [[mobile-fab-bottom-nav]].
- **Sidebar desktop** 280px; item aktif `bg-primary` teks putih `rounded-xl`.
- **Dihilangkan:** kotak pencarian & lonceng top bar, kartu "Status Dompet", label versi, kartu Sisa Anggaran, peringatan anggaran AI, Wawasan Cerdas, sinkronisasi bank. Lihat [[no-bank-sync-no-ai-yet]].
- Ikon: Material Symbols Outlined (sama dengan HTML Stitch).

## Token (dari Stitch)

```yaml
name: Modern Financial Operating System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444651'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#0d0097'
  on-tertiary: '#ffffff'
  tertiary-container: '#2724b8'
  on-tertiary-container: '#a1a4ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
```


## Brand & Style

This design system translates the principles of Material Design 3 Expressive into an executive-grade desktop financial management suite. The brand personality balances institutional trust with dynamic, human-centric agility: authoritative, hyper-focused, intelligent, and lucid. 

The aesthetic is anchored in **Modern Expressive Materialism**:
- Deep navy field structures combined with expressive, variable container shapes.
- High-contrast typography that commands numerical precision and clear data hierarchies.
- Contextual, emotional cues powered by purpose-built semantic accents (emerald teal for surplus and positive cash flow, rose-coral for burn and expenditure, and luminous lavender/indigo designating algorithmic intelligence and assistive automation).
- Native bilingual architecture natively accommodating Indonesian (`ID`) and English (`EN`) nomenclature without layout destabilization.

The emotional objective is absolute financial lucidity—eradicating ledger anxiety and replacing it with strategic command.

## Colors

The color palette adheres to the tonal container hierarchies of Material Design 3, tuned for high-density financial modeling and analytical workflows.

### Primary (Structural Anchor & Trust)
- `primary`: `#1E3A8A` (Deep Blue 700) — Primary interactive states, active navigation tabs, high-emphasis actionables.
- `on-primary`: `#FFFFFF`
- `primary-container`: `#DBEAFE` (Blue 100) — Active selection fills, primary metrics card backdrops.
- `on-primary-container`: `#1E3A8A`
- `primary-fixed`: `#0A192F` (Deep Abyss Navy) — Desktop persistent sidebar, app bar banners, high-contrast badges.

### Semantic Accents (Directional Cash Flow)
- **Positive / Income (Emerald Teal)**
  - `positive`: `#059669`
  - `positive-container`: `#D1FAE5`
  - `on-positive-container`: `#065F46`
- **Negative / Expenses (Coral Rose)**
  - `negative`: `#E11D48`
  - `negative-container`: `#FFE4E6`
  - `on-negative-container`: `#9F1239`

### Intelligence / AI Insights (Soft Lavender & Indigo)
- `tertiary` (AI Core): `#6366F1`
- `tertiary-container`: `#EEF2FF`
- `on-tertiary-container`: `#3730A3`
- `tertiary-surface`: `#F5F3FF` — Ambient backgrounds for automated budgeting insights and smart categorization cards.

### Neutrals & Surfaces (Tonal Stacking)
- `surface`: `#F8FAFC` (Slate 50) — Canvas base.
- `surface-dim`: `#F1F5F9` (Slate 100) — Subtle recessed data grids.
- `surface-container-low`: `#FFFFFF` — Primary metric cards, interactive ledgers.
- `surface-container`: `#F8FAFC` — Standard container base.
- `surface-container-high`: `#E2E8F0` — Dividers, structural lines, disabled elements.
- `outline`: `#CBD5E1`
- `outline-variant`: `#E2E8F0`
- `on-surface`: `#0F172A` (Slate 900) — Primary numerical and textual readouts.
- `on-surface-variant`: `#64748B` (Slate 500) — Secondary labels, timestamps, metadata.

## Typography

Typography pairs `Plus Jakarta Sans` for humanist, geometric authority with `JetBrains Mono` for tabular precision.

### Functional Implementation Rules
- **Monetary Readouts & Tabular Data:** All financial amounts, currency indicators (`Rp`, `IDR`, `$`, `USD`), balance statements, percentages, and serial identifiers must strictly use `JetBrains Mono` (`label-lg` through `label-sm`) with tabular figures (`font-variant-numeric: tabular-nums`) enabled.
- **Bilingual Typographic Balance:** Indonesian localized terms tend to run 15–25% longer than their English counterparts (e.g., *Total Balance* vs. *Total Saldo Kas*, *Income Statement* vs. *Laporan Laba Rugi*). Title and label containers must employ flex wrapping and generous truncation ceilings with automatic tooltips.
- **Hierarchy:** High-emphasis totals (Net Worth / *Kekayaan Bersih*) utilize `display-md` or `headline-lg`, ensuring zero ambiguity during desktop multi-window viewing.

## Layout & Spacing

The layout is built for expansive desktop financial displays using an asymmetrical 12-column responsive fluid grid framework optimized for widescreen density.

### Breakpoints & Layout Architecture
- **Desktop Standard (`1280px` - `1599px`):** 12-column grid; `margin: 2rem`; `gutter: 1.5rem`. Fixed `280px` left rail navigation.
- **Desktop Ultra-wide (`1600px+`):** 12-column grid with a pinned collapsible right rail (`360px`) dedicated to real-time AI Cashflow Intelligence (*Wawasan Cerdas*).
- **Reflow & Compact Windows (`<1280px`):** The navigation rail automatically collapses to a high-density icon bar (`72px`), and the secondary telemetry grid reflows from 4 columns to 2 columns.

### Density Philosophy
Empty layout distance prioritizes structural separation over decorative whitespace. Grid gutters (`1.5rem`) maintain distinct visual channels between analytical cards, while internal component paddings strictly follow the 8-point baseline scale (`space-xs` through `space-xl`) to support scanning speed across massive transaction logs.

## Elevation & Depth

This design system uses Material 3 Expressive's **Tonal Layering** system, avoiding dark drop shadows in favor of surface-color tiering and ambient color bleed.

### Surface Elevation Hierarchy
- **Level 0 (Base Canvas):** `#F8FAFC`. Zero elevation, non-interactive root canvas.
- **Level 1 (Card & Modular Tiles):** `#FFFFFF` paired with an ambient tinted shadow:
  - `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05);`
  - Border: `1px solid #E2E8F0`.
- **Level 2 (Active & Hover Cards):** Surface elevated with a navy-tinted ambient glow:
  - `box-shadow: 0 10px 25px -5px rgba(30, 58, 138, 0.08), 0 8px 10px -6px rgba(30, 58, 138, 0.04);`
  - Subtle upward translation (`transform: translateY(-2px)`).
- **Level 3 (Flyouts, Menus & Dropdowns):**
  - `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06);`
- **Level 4 (AI Modals & Contextual Insights Overlays):**
  - Ambient lavender-tinted backdrop blur: `backdrop-filter: blur(12px) saturate(180%);`
  - Ambient perimeter glow: `box-shadow: 0 25px 50px -12px rgba(99, 102, 241, 0.25);`

## Shapes

In alignment with Material Design 3 Expressive, shapes are soft, inviting, and organic, offsetting the rigid mathematical nature of financial accounting.

### Shape Assignment Rules
- **Base Components (`rounded-md` / `0.5rem`):** Data table cells, inline form controls, dropdown options, and micro-metric badges.
- **Primary Buttons & Chips (`rounded-full` / `9999px`):** High-priority callouts, action pills, category filters, and status toggles.
- **Cards & Data Modules (`rounded-2xl` / `1rem`):** Standard analytical cards, transaction list blocks, and modal dialog panels.
- **Hero & Insight Surfaces (`rounded-3xl` / `1.5rem`):** Primary cashflow overview container, monthly budget summary card, and AI predictive alert banners.

## Components

### Buttons
- **Primary (Filled):** Solid navy `#1E3A8A`, on-primary white text, `rounded-full`, padding `0.75rem 1.5rem`. Bold, tactile state change with an active compression animation (`scale(0.98)`).
- **Secondary (Tonal Positive):** `#D1FAE5` with `#065F46` label for cash inflow operations (*Tambah Dana / Add Funds*).
- **Secondary (Tonal Negative):** `#FFE4E6` with `#9F1239` label for cash outflows (*Kirim Uang / Transfer*).
- **Tertiary AI Trigger:** Gradient border with tertiary `#EEF2FF` fill and `#6366F1` label featuring a sparkle glyph.

### Chips & Filter Pills
- Fully pill-shaped (`rounded-full`). Unselected state features `#F1F5F9` fill with `#64748B` text. Selected state adopts `primary-container` fill (`#DBEAFE`) with `#1E3A8A` text and a preceding micro check-icon.

### Cards & Ledger Blocks
- Structural card backgrounds use pure white (`#FFFFFF`) framed by `rounded-2xl` with a crisp `1px` border of `#E2E8F0`. 
- **Tonal Category Strip:** Transaction cards contain an internal vertical left accent border (4px) coded directly to the transaction class: Teal (`#10B981`) for Income (*Pemasukan*), Rose (`#F43F5E`) for Expenses (*Pengeluaran*), and Indigo (`#6366F1`) for Internal Transfer/Investment (*Investasi*).

### Input Fields & Selectors
- Filled styling with subtle `1px` border: Background `#F8FAFC`, border `#CBD5E1`, `rounded-xl`. 
- When focused, transitions to a 2px ring of `#1E3A8A` with a background transition to `#FFFFFF`. Currency prefix containers (`IDR`, `Rp`, `USD`) are rendered in `JetBrains Mono` with muted Slate fill.

### Checkboxes & Radios
- `rounded-md` for checkboxes; circular for radio. Checked fill is `#1E3A8A` displaying an interior white tick. Keyboard focus invokes a 4px lavender halo (`rgba(99, 102, 241, 0.25)`).

### AI Smart Insight Surfaces (*Wawasan Cerdas*)
- Specialized containers featuring a soft gradient blend from `#F5F3FF` to `#EEF2FF`, bounded by a soft indigo border (`#C7D2FE`). Includes a prominent header badge displaying bilingual status labels (e.g., `AI PREDICTION • PREDIKSI AI`) set in `label-sm`.