# TaMoney — Fase 1 + 2 Design Spec

Tanggal: 2026-10-29
Status: Disetujui (desain), menunggu review spec

## 1. Tujuan

Web app pencatatan dan pemantauan keuangan pribadi bernama **TaMoney**. Spec ini mencakup PRD Fase 1 (catat transaksi, ringkasan dashboard) dan Fase 2 (ringkasan bulanan, ringkasan kategori, riwayat transaksi, kelola wallet), ditambah login dasar dan transfer antar dompet. Fase 3 (AI) dan sisa Fase 4 (pengaturan profil, ekspor, pengingat) adalah spec terpisah.

**Sukses berarti:** pengguna bisa daftar/masuk, membuat wallet, mencatat pemasukan/pengeluaran/transfer dalam beberapa detik dari HP maupun desktop, lalu melihat saldo, tren bulanan, dan porsi kategori yang benar — semua di-deploy di Vercel dengan data di Supabase.

## 2. Keputusan yang sudah diambil

| Topik | Keputusan |
|---|---|
| Cakupan | Fase 1 + 2, plus login (daftar, masuk, keluar, lupa password) |
| Nama | TaMoney (desain Stitch memakai "FinFlow" — diganti) |
| Desain | Project Stitch "TaMoney Design" (`projects/15030374646572842565`) |
| Fitur ekstra dari desain | Transfer antar dompet: **ya**. Batas anggaran, ekspor PDF/CSV: **tidak** (nanti) |
| Konten desain non-PRD | Sinkronisasi bank / Open API, kartu AI insight, data contoh (Sarah, BCA, dll): **dihilangkan** |
| Mobile | Responsif: sidebar → bottom nav; tombol "+" melayang membuka form Catat Singkat |
| Bahasa & mata uang | UI Bahasa Indonesia; IDR saja (multi-mata uang di Fase 4) |
| Tooling agen | Plugin Claude Code **Ponytail** (diinstal user) — tidak memengaruhi kode aplikasi |

## 3. Arsitektur

- **Next.js (App Router, TypeScript)** di Vercel.
  - Halaman = Server Components yang membaca data langsung dari Supabase.
  - Mutasi = Server Actions (tambah/edit/hapus transaksi, kelola wallet), lalu `revalidatePath`.
  - Komponen interaktif (form, chart, filter) = Client Components kecil.
- **Supabase**: Postgres + Auth. Klien via `@supabase/ssr` (cookie session). `middleware.ts` me-refresh sesi dan mengarahkan pengguna yang belum masuk ke `/masuk`.
- **Keamanan**: Row Level Security di semua tabel; hanya anon key di sisi klien. Service role key tidak dipakai di app.
- **Styling**: Tailwind CSS dengan token dari Stitch DESIGN.md (warna, font Plus Jakarta Sans + JetBrains Mono, radius, shadow). Ikon: Material Symbols (sama seperti HTML Stitch).
- **Chart**: Recharts (bar chart tren, donut kategori).

### Struktur folder

```
app/
  (auth)/masuk, daftar, lupa-password, reset-password
  (app)/layout.tsx        sidebar desktop + bottom nav mobile + FAB
  (app)/page.tsx          Dashboard
  (app)/analitik/page.tsx
  (app)/dompet/page.tsx
  auth/callback/route.ts  tukar kode email (verifikasi & reset)
components/               komponen UI per fitur
lib/
  supabase/               server.ts, client.ts, middleware.ts
  money.ts                format & parse rupiah
  reports.ts              agregasi bulanan & kategori (fungsi murni)
  actions/                server actions per domain
supabase/migrations/      skema SQL
docs/knowledge/           knowledge base (lihat §8)
```

## 4. Model data

Semua jumlah uang = `bigint` rupiah utuh (tanpa desimal). Semua tabel punya `user_id uuid references auth.users` + RLS `user_id = auth.uid()` untuk select/insert/update/delete.

**profiles** — `id` (= auth.users.id), `display_name`, `currency` default `'IDR'`, `created_at`. Dibuat oleh trigger `on auth.users insert`.

**wallets** — `id`, `user_id`, `name` (wajib, ≤ 50 karakter), `type` enum `cash | bank | ewallet | other`, `initial_balance bigint default 0`, `archived_at timestamptz null`, `created_at`.

**categories** — `id`, `user_id`, `kind` enum `income | expense`, `name`, `icon` (nama Material Symbol), `created_at`. Unik per `(user_id, kind, name)`. Trigger signup yang sama mengisi kategori bawaan:
- Pengeluaran: Makan & Minum, Transportasi, Belanja, Tagihan & Utilitas, Hiburan, Kesehatan, Lainnya
- Pemasukan: Gaji, Bonus, Hasil Investasi, Lainnya

**transactions** — `id`, `user_id`, `kind` enum `income | expense | transfer`, `amount bigint check (amount > 0)`, `wallet_id` (sumber), `to_wallet_id null`, `category_id null`, `note text null` (≤ 200), `occurred_at timestamptz default now()`, `created_at`.
- Constraint: `transfer` ⇒ `to_wallet_id` wajib, `≠ wallet_id`, `category_id` null. `income/expense` ⇒ `category_id` wajib, `to_wallet_id` null.
- Kategori harus sesuai jenis (pengeluaran memakai kategori `expense`) — divalidasi di server action.
- Index: `(user_id, occurred_at desc)`.
- `wallet_id`/`to_wallet_id` → `on delete restrict`; wallet tidak dihapus, hanya diarsipkan.

**wallet_balances** (view, `security_invoker = true`) — per wallet: `initial_balance + Σincome − Σexpense − Σtransfer keluar + Σtransfer masuk`. Saldo tidak pernah disimpan sehingga tidak bisa melenceng.

## 5. Halaman & perilaku

Tata letak mengikuti screenshot Stitch (disimpan di `docs/knowledge/stitch/`).

### Auth
- `/daftar`: nama, email, password (≥ 8). Supabase mengirim email verifikasi; setelah verifikasi → dashboard.
- `/masuk`: email + password; pesan error dalam Bahasa Indonesia.
- `/lupa-password` → email reset → `/reset-password` untuk set password baru.
- Keluar: tombol di menu avatar.

### Dashboard (`/`)
- Sapaan + tanggal hari ini.
- Kartu: **Saldo Total** (Σ saldo wallet aktif), **Pemasukan bulan ini**, **Pengeluaran bulan ini** (transfer tidak dihitung).
- **Dompet**: kartu per wallet aktif dengan saldo; link "Kelola Semua".
- **Aktivitas Hari Ini**: transaksi tanggal hari ini (zona waktu `Asia/Jakarta`), link "Lihat Semua" → `/analitik`.
- **Catat Singkat** (kolom kanan di desktop): toggle Pengeluaran/Pemasukan, pintasan nominal (20rb, 50rb, 100rb, 500rb — menambah ke nominal), input nominal, dropdown Dompet & Kategori, catatan, tanggal (default hari ini), tombol Simpan.
- Kartu "Sisa Anggaran", peringatan anggaran AI, dan "Wawasan Cerdas" dari desain **tidak** dibuat.

### Tombol cepat (mobile)
- Di < 768px: bottom nav (Dashboard, Analitik, Dompet) + tombol "+" melayang di semua halaman `(app)` yang membuka Catat Singkat sebagai bottom sheet.
- Di desktop: tombol "Catat Transaksi" di top bar membuka form yang sama sebagai dialog.

### Analitik & Riwayat (`/analitik`)
- **Pilih Periode**: pemilih bulan (default bulan berjalan); disimpan di query string `?bulan=2026-10`.
- **Kartu**: Total Pemasukan, Total Pengeluaran, Selisih (surplus/defisit), masing-masing dengan % vs bulan sebelumnya.
- **Tren Arus Kas**: bar chart pemasukan vs pengeluaran untuk 6 bulan berakhir di bulan terpilih.
- **Porsi Kategori**: donut pengeluaran per kategori + daftar peringkat (terbesar → terkecil) dengan nominal, %, dan perubahan vs bulan sebelumnya.
- **Riwayat Transaksi**: tabel (kartu di mobile) semua transaksi bulan terpilih; cari teks pada catatan/nama kategori; filter dompet, kategori, jenis (Semua/Masuk/Keluar/Transfer); 20 per halaman. Setiap baris: Edit (dialog; pemasukan/pengeluaran memakai form Catat Singkat, transfer memakai form transfer — jenis tidak bisa diubah antar keduanya) dan Hapus (konfirmasi).
- Tombol "Ekspor Data" dan "Sinkronisasi" dari desain **tidak** dibuat.

### Kelola Dompet (`/dompet`)
- Kartu ringkasan: total saldo, jumlah dompet aktif, jumlah diarsipkan.
- **Portofolio**: kartu per wallet aktif (nama, jenis, saldo) dengan menu Ubah / Arsipkan.
- **Tambah Wallet**: dialog nama, jenis, saldo awal.
- **Ubah**: nama & jenis (saldo awal juga bisa diubah — memengaruhi saldo hitungan).
- **Arsipkan**: wallet hilang dari dropdown & total; transaksinya tetap di riwayat. Bagian "Diarsipkan" dengan tombol **Pulihkan**. Tidak ada hapus permanen.
- **Transfer Antar Dompet**: form dari → ke → nominal → catatan; tidak boleh ke wallet yang sama. Daftar 10 transfer terakhir.
- Elemen desain yang dihilangkan: nomor rekening, biaya admin, "Integrasi Finansial Terbuka", wawasan cerdas, seret untuk urutkan.

### Keadaan kosong & error
- Pengguna baru tanpa wallet: dashboard menampilkan ajakan "Buat dompet pertama" (form Catat Singkat dinonaktifkan sampai ada wallet).
- Server action mengembalikan `{ error }` yang ditampilkan di form; input divalidasi dengan Zod di server (nominal > 0 dan ≤ 1 triliun, wallet milik user dan tidak diarsipkan, kategori sesuai jenis).
- Kegagalan memuat data → `error.tsx` per segmen dengan tombol coba lagi.

## 6. Logika agregasi (`lib/reports.ts`)

Fungsi murni yang menerima daftar transaksi dan mengembalikan:
- `monthTotals(txs)` → `{ income, expense, net }` (transfer diabaikan).
- `monthlyTrend(txs, endMonth, n=6)` → array per bulan, bulan tanpa transaksi = 0.
- `categoryBreakdown(txs, prevTxs)` → kategori pengeluaran terurut menurun dengan `amount`, `share`, `deltaVsPrev`.
- Pengelompokan bulan memakai zona waktu `Asia/Jakarta`.

`lib/money.ts`: `formatRupiah(n)` → `Rp 1.250.000`; `parseRupiah("1.250.000")` → `1250000`.

## 7. Pengujian

- **Vitest** untuk `lib/money.ts` dan `lib/reports.ts` (transfer tidak masuk total, batas bulan di WIB, bulan kosong, porsi kategori berjumlah 100%).
- **Migrasi SQL** diuji dengan `supabase db reset` lokal bila Docker tersedia; jika tidak, cek RLS manual dengan dua akun di project Supabase.
- **Manual di browser** (desktop 1280px & mobile 375px): daftar → buat wallet → catat → edit → hapus → transfer → arsipkan → cek angka di dashboard & analitik.

## 8. Knowledge base (`docs/knowledge/`)

Folder ini adalah **vault Obsidian**: setiap catatan punya frontmatter YAML (`title`, `tags`, `updated`), saling terhubung dengan `[[wikilink]]`, gambar di-embed `![[file.png]]`, dan `README.md` berfungsi sebagai MOC. Keputusan & fakta proyek disimpan sebagai **memory** di `docs/knowledge/memory/`, satu catatan per keputusan.

| File | Isi |
|---|---|
| `README.md` | Indeks dan cara memakai dokumen ini |
| `prd.md` | PRD lengkap Fase 1–4 + status tiap fitur |
| `design-system.md` | DESIGN.md Stitch + penyesuaian TaMoney (nama, mobile) |
| `screens.md` | Tiap layar Stitch → route, komponen, apa yang dibuat/dihilangkan |
| `stitch/` | Screenshot & HTML asli dari Stitch sebagai referensi |
| `architecture.md` | Struktur Next.js, alur auth, server actions |
| `database.md` | Skema, view, RLS, kategori bawaan |
| `deployment.md` | Setup Supabase & Vercel, env vars, langkah deploy |

`CLAUDE.md` di root menunjuk ke `docs/knowledge/README.md`.

## 9. Deployment

- **Supabase**: user membuat project (gratis) lalu `supabase login` + `supabase link`; migrasi dijalankan `supabase db push`. Di Auth settings: Site URL = domain Vercel, redirect URL `https://<domain>/auth/callback`.
- **Vercel**: repo GitHub dihubungkan ke project Vercel (`vercel login` + `vercel link`, atau lewat dashboard). Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Claude tidak membuat akun; user login ke kedua CLI saat tahap deploy.

## 10. Di luar cakupan

Tanya AI & saran hemat (Fase 3); pengaturan profil & mata uang, ekspor CSV/PDF, pengingat harian (Fase 4); batas anggaran; sinkronisasi bank; PWA/offline; multi-mata uang.
