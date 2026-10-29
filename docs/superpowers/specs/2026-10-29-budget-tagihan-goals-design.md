# TaMoney — Budget Gajian, Tagihan Rutin, Goals & Notifikasi

Tanggal: 2026-10-29
Status: Desain disetujui, menunggu review spec

## 1. Tujuan

Tiga fitur perencanaan yang saling terhubung, plus satu panel notifikasi:

1. **Budget gajian**: setiap gaji masuk (default tanggal 25), gaji dibagi otomatis ke *pos budget* berdasarkan persentase. Pemakaian tiap pos dipantau sampai gaji berikutnya.
2. **Tagihan rutin**: daftar pengeluaran berulang (Netflix, kost, wifi, listrik). Muncul sebagai pengingat; satu tap "Bayar" mencatat pengeluarannya.
3. **Goals**: tujuan menabung atau investasi yang terhubung ke dompet tujuan, dengan target, due date opsional, dan setoran bulanan.
4. **Panel notifikasi in-app**: hal-hal mendatang dan yang perlu tindakan.

**Sukses berarti:**
- Tama mencatat "gaji Oktober Rp 12 jt ke BRI" sekali, lalu langsung melihat 11 pos budget dengan nominal dan sisa masing-masing.
- Tagihan jatuh tempo muncul di lonceng H-3 dan bisa dibayar dalam dua tap.
- Setoran goal tercatat sebagai transfer, jadi saldo dompet tetap benar.
- Persentase budget bisa diubah di **Pengaturan**.

## 2. Keputusan yang sudah diambil

| Topik | Keputusan |
|---|---|
| Uang goal | Goal terhubung ke **dompet tujuan**. "Setor" = transfer dari dompet sumber ke dompet tujuan dengan `goal_id`. |
| Tagihan jatuh tempo | **Ingatkan + tombol Bayar**: tidak ada transaksi otomatis. |
| Notifikasi | **Panel in-app saja**, diturunkan dari data saat render. Tanpa tabel notifikasi, tanpa push, tanpa cron. |
| Unit budget | **Pos budget**: satu pos menampung 1+ kategori pengeluaran. |
| Persentase | Default dari analisis gaji Rp 12 jt (§4.3). Bisa diubah di halaman baru **Pengaturan**. |
| Navigasi | Ringkasan · Budget · Rencana (Goals \| Tagihan) · Analitik · Dompet. Tab bar mobile tetap 5. |
| Deploy | Lokal dulu; produksi hanya atas persetujuan user. |

## 3. Data (satu migration)

Mengikuti pola yang ada:
- RLS `to authenticated` dengan `user_id = auth.uid()`.
- FK pemilik komposit `(x_id, user_id)`.
- Uang `bigint` rupiah utuh.
- Index untuk setiap FK.

```
profiles.payday_day     smallint not null default 25 check (between 1 and 28)

budget_groups           -- pos budget
  id, user_id, name (1..40, unique per user), icon,
  pct_bp int not null check (0..10000)   -- basis poin; total 10000 dijaga di app
  is_savings bool not null default false -- tepat satu per user: pos Tabungan & Investasi
  sort smallint, created_at

categories.budget_group_id uuid null → budget_groups (owner-scoped, on delete set null (budget_group_id))

budget_periods          -- satu per gaji
  id, user_id,
  month date not null            -- tanggal 1 bulan label ("Oktober" = 2026-10-01); unique (user_id, month)
  start_date date not null       -- tanggal gaji diterima
  salary bigint not null > 0
  income_tx_id uuid null → transactions (owner-scoped, on delete set null)
  created_at

budget_allocations
  period_id → budget_periods on delete cascade, group_id → budget_groups on delete cascade,
  amount bigint not null >= 0, primary key (period_id, group_id)

goals
  id, user_id, name (1..50), icon,
  target bigint > 0, initial_amount bigint not null default 0   -- uang yang sudah ada sebelum pakai TaMoney
  due_date date null, monthly_amount bigint null                 -- dipakai jika tanpa due date
  wallet_id not null → wallets (dompet tujuan), source_wallet_id null → wallets (sumber default)
  achieved_at, archived_at, created_at

bills
  id, user_id, name (1..50), icon, amount bigint > 0 (perkiraan),
  category_id not null → categories (expense), wallet_id not null → wallets,
  cadence bill_cadence ('weekly','monthly','yearly'),
  due_day smallint null (1..31, untuk monthly/yearly: hari asli agar tgl 31 kembali ke 31 setelah Februari),
  next_due date not null, remind_days smallint not null default 3 (0..14),
  archived_at, created_at

transactions.goal_id uuid null → goals  (check: goal_id is null or kind = 'transfer')
transactions.bill_id uuid null → bills  (check: bill_id is null or kind = 'expense')
```

**RPC `pay_bill(bill_id, amount, wallet_id, occurred_at)`**
- `security invoker`, plpgsql, `search_path = ''`.
- Insert pengeluaran (`bill_id`, kategori tagihan) **dan** majukan `next_due` dalam satu transaksi DB.
- Rumus `next_due` disalin dari `lib/bills.ts` dan diuji oleh test yang sama lewat kasus contoh.

**RPC `record_salary(month, salary, wallet_id, occurred_at, allocations jsonb)`**: `security invoker`. Menulis transaksi gaji, periode, dan alokasi secara atomik (insert, atau update jika bulan itu sudah ada). Menolak jika total alokasi ≠ gaji.

**Seed** (dalam migration, untuk user yang sudah ada, dan di `handle_new_user` untuk user baru):
- Kategori baru jika belum ada: **Groceries** (`shopping_cart`), **Kost & Rumah** (`home`), **Langganan** (`subscriptions`).
- 11 pos default dengan persentase §4.3. Kategori dipetakan berdasarkan nama:

| Pos | Kategori |
|---|---|
| Tabungan & Investasi *(is_savings)* | Investasi |
| Rumah & Kost | Kost & Rumah, Tagihan & Utilitas |
| Makanan | Makan & Minum |
| Groceries | Groceries |
| Transportasi | Transportasi |
| Belanja | Belanja |
| Kesehatan | Kesehatan |
| Hiburan | Hiburan |
| Langganan | Langganan |
| Gereja & Sosial | Gereja |
| Lain-lain | Lainnya, Tarik Tunai |

Kategori yang tidak cocok dibiarkan tanpa pos.

## 4. Budget gajian

### 4.1 Alur "Catat gaji"

Tombol ada di halaman Budget (dan di notifikasi). Form berisi:
- **Bulan**: Picker, default bulan berjalan.
- **Jumlah**
- **Dompet**: default dompet gaji terakhir.
- **Tanggal**: DateField, default tanggal payday.

Di bawah form ada **pratinjau alokasi** per pos, dan setiap nominal bisa disunting.

Simpan menjalankan RPC `record_salary`, yang dalam satu transaksi DB:
1. Membuat transaksi income (kategori Gaji).
2. Membuat `budget_periods`.
3. Membuat `budget_allocations`.

Jika bulan itu sudah punya periode, form berubah jadi **edit**: gaji/alokasi diperbarui, dan transaksi gaji ikut diperbarui.

### 4.2 Periode dan pemakaian

- Periode dimulai pada `start_date` dan berakhir sehari sebelum `start_date` periode berikutnya.
- Selama gaji berikutnya belum dicatat, periode tetap berjalan. Label tampil "25 Okt – 24 Nov" (dari payday), tapi jika gaji telat, pengeluaran tetap masuk periode lama.
- **Pemakaian pos biasa** = jumlah pengeluaran pada kategori pos itu dalam rentang periode.
- **Pemakaian pos Tabungan** = pengeluaran kategori pos itu (mis. Investasi) + total setoran goal (transfer ber-`goal_id` ke dompet goal) − penarikan goal.
- Pengeluaran yang kategorinya tanpa pos tampil di baris **"Belum masuk pos"**, dengan tautan ke Pengaturan.
- Bar per pos:
  - Pos biasa: hijau → oranye (≥80%) → merah (>100%).
  - Pos Tabungan: dibaca terbalik sebagai progres menuju target (hijau saat tercapai).
- Halaman Budget menampilkan:
  - Ringkasan periode: gaji, terpakai, sisa, hari tersisa, dan "aman per hari" = sisa pos non-tabungan ÷ hari tersisa.
  - Daftar pos.
  - Di pos Tabungan: "Kebutuhan setoran goal Rp X dari alokasi Rp Y".
  - Pemilih periode untuk melihat periode lalu.
- Akhir periode (gaji berikutnya dicatat): jika ada sisa pos non-tabungan, tampilkan ajakan "Pindahkan sisa Rp X ke goal" yang membuka form Setor.

### 4.3 Persentase default

Dari analisis gaji Rp 12 jt dan pengeluaran nyata 17 Sep–29 Okt.

| Pos | bp | Pada 12 jt |
|---|---|---|
| Tabungan & Investasi | 3333 | 4.000.000 |
| Rumah & Kost | 2000 | 2.400.000 |
| Makanan | 1500 | 1.800.000 |
| Groceries | 750 | 900.000 |
| Transportasi | 500 | 600.000 |
| Belanja | 500 | 600.000 |
| Kesehatan | 417 | 500.000 |
| Hiburan | 333 | 400.000 |
| Langganan | 250 | 300.000 |
| Gereja & Sosial | 250 | 300.000 |
| Lain-lain | 167 | 200.000 |

**Aturan pembulatan (`allocate`):**
- Setiap pos non-tabungan = `salary × bp / 10000`, dibulatkan ke **Rp 10.000** terdekat.
- Pos Tabungan = gaji − jumlah pos lain.
- Total selalu persis sama dengan gaji, dan sisa pembulatan masuk tabungan.
- Jika hasil tabungan negatif (persentase aneh), pos-pos lain dipotong dari yang terbesar sampai tabungan = 0.

### 4.4 Pengaturan (`/pengaturan`)

Halaman baru, dibuka dari menu akun. Isinya:

- **Budget**
  - Payday: Picker tanggal 1–28.
  - Daftar pos, masing-masing dengan:
    - Ikon dan nama yang bisa diubah.
    - Kolom persen (1 desimal).
    - MultiSelect kategori. Satu kategori hanya bisa di satu pos; memilihnya di pos lain memindahkannya.
  - Indikator total, dan Simpan hanya aktif jika total = 100,0%.
  - Pratinjau rupiah memakai gaji terakhir.
  - Tambah pos, dan hapus pos lewat Confirm. Pos Tabungan tidak bisa dihapus.
  - Tombol "Kembalikan ke default".
  - Perubahan berlaku untuk **periode berikutnya**. Periode berjalan diubah lewat "Ubah alokasi" di halaman Budget.
- **Pintasan iPhone**: kartu tautan ke `/pintasan` yang sudah ada.

## 5. Tagihan rutin (Rencana → Tagihan)

- **Daftar** dikelompokkan: Terlambat · 7 hari ke depan · Nanti. Setiap baris berisi ikon, nama, nominal, dompet, dan "dalam 3 hari" / "terlambat 2 hari". Di atas daftar ada **total tagihan bulan ini**.
- **Form tambah/edit** (dialog): nama, ikon (dari daftar ikon kategori), nominal perkiraan, kategori (Picker, expense), dompet, siklus (Segmented: Mingguan/Bulanan/Tahunan), jatuh tempo berikutnya (DateField), ingatkan H-? (0–14). Kategori default = Langganan; ikon default mengikuti kategori.
- **Bayar**: dialog dengan nominal (bisa diedit), dompet, dan tanggal (default hari ini), lalu memanggil `pay_bill`. Jatuh tempo maju satu siklus.
- **Lewati bulan ini**: memajukan jatuh tempo tanpa transaksi, lewat Confirm.
- Arsipkan, bukan hapus (sama seperti dompet).

**Aturan `nextDue`:**
- Monthly memakai `due_day` dan dipotong ke hari terakhir bulan (31 → 30 Nov → 28/29 Feb → 31 Mar).
- Yearly: tanggal yang sama tahun depan, 29 Feb → 28 Feb.
- Weekly: +7 hari.

## 6. Goals (Rencana → Goals)

- **Kartu goal** berisi:
  - Ikon dan nama.
  - Cincin progres: terkumpul / target.
  - Due date dan sisa bulan.
  - Dompet tujuan.
  - "Setoran bulan ini: Rp X dari Rp Y".
  - Status **Sesuai rencana / Tertinggal / Tercapai**.
- **Form**: nama, ikon, target, sudah terkumpul (`initial_amount`), due date (opsional), setoran bulanan (wajib jika tanpa due date; jika ada due date, ditampilkan sebagai saran yang dihitung), dompet tujuan, dompet sumber default.
- **Setor**: transfer `source → wallet_id` dengan `goal_id`, memakai form transfer yang ada.
- **Tarik**: transfer `wallet_id → dompet lain` dengan `goal_id`, yang mengurangi progres.
- **Terkumpul** = `initial_amount` + Σ setoran − Σ penarikan.
- **Kebutuhan bulanan** (`monthlyNeed`):
  - Dengan due date: `ceil((target − terkumpul) / sisaPeriode)` ke Rp 1.000. `sisaPeriode` = jumlah payday dari periode berjalan sampai due date, minimal 1.
  - Tanpa due date: `monthly_amount`.
- **Status:**
  - Tercapai jika terkumpul ≥ target. `achieved_at` diisi; tampilkan ajakan arsip.
  - Tertinggal jika setoran periode ini < kebutuhan bulanan dan sisa hari periode ≤ 7, **atau** due date sudah lewat.
  - Selain itu: Sesuai rencana.
- Satu dompet boleh dipakai beberapa goal. Progres dihitung per `goal_id`, bukan dari saldo dompet.

## 7. Panel notifikasi

**Tampilan:**
- Lonceng di header kaca, di sebelah "+".
- Badge berisi jumlah item yang perlu tindakan.
- Desktop membuka Popover (lebar 360); mobile membuka sheet yang bisa ditarik (pola yang sudah ada).

**Isi:** item dibangun oleh `buildNotifications()` (murni, teruji), diurutkan dari yang paling mendesak.

| Jenis | Kapan | Tindakan |
|---|---|---|
| Tagihan terlambat | `next_due < hari ini` | Bayar |
| Tagihan mendatang | `next_due − remind_days ≤ hari ini` | Bayar |
| Gaji belum dicatat | hari ini ≥ payday dan belum ada periode untuk bulan ini | Catat gaji |
| Pos budget | ≥ 80% atau > 100% pada periode berjalan | Lihat Budget |
| Setoran goal | Goal belum memenuhi kebutuhan bulanan periode ini | Setor |
| Goal tertinggal | Status Tertinggal | Lihat goal |
| Goal tercapai | `achieved_at` dalam 7 hari terakhir | Lihat goal |

Item hilang sendiri ketika kondisinya selesai. Tidak ada status "sudah dibaca" (YAGNI).

**Pengambilan data:**
- Layout `(app)` memanggil `getPlanningState(sb)`, yang di-cache per request lewat `cache()`.
- Datanya: tagihan aktif, goal aktif + progres, periode berjalan + pemakaian, dan profil (payday).
- Halaman Budget, Rencana, dan Ringkasan memakai fungsi yang sama, jadi tidak ada query ganda.

## 8. Ringkasan

Tiga kartu baru di bawah kartu saldo:
- **Budget periode ini**: sisa, aman per hari, dan bar total.
- **Tagihan berikutnya**: 3 teratas, masing-masing dengan tombol Bayar.
- **Goals**: 2 goal dengan cincin progres.

Setiap kartu punya empty state yang mengajak membuat datanya.

## 9. Modul & file

- **`lib/budget.ts`**: `allocate(salary, groups)`, `periodLabel(start, payday)`, `periodRange(periods, i, today)`, `usage(groups, txs, range)`, `safePerDay`.
- **`lib/bills.ts`**: `nextDue(bill)`, `dueStatus(bill, today)`.
- **`lib/goals.ts`**: `saved(goal, txs)`, `monthlyNeed`, `goalStatus`.
- **`lib/notifications.ts`**: `buildNotifications(state, today)`.
- **`lib/actions/`**: budget, bills, goals, settings. Server Actions dengan validasi di `lib/validation.ts`.
- **`app/(app)/budget/page.tsx`**
- **`app/(app)/rencana/page.tsx`**: tab lewat `?tab=goals|tagihan`, dengan `useUrlState`.
- **`app/(app)/pengaturan/page.tsx`**
- **`components/budget/*`**, **`components/bills/*`**, **`components/goals/*`**
- **`components/shell/Notifications.tsx`**
- **Nav**: item Budget (`pie_chart`) dan Rencana (`flag`).
- **UserMenu**: tambah "Pengaturan".

`MonthGrid`/`DateField` sekarang mematikan tanggal masa depan. Keduanya mendapat prop `max?: string` (default hari ini; `null` = tanpa batas), karena jatuh tempo tagihan dan due date goal ada di masa depan.

Semua UI memakai komponen inti (Button, Field, Picker, DateField, Popover, Confirm, Segmented, MultiSelect) dan `motion/react`.

## 10. Pengujian

- **Vitest untuk semua fungsi murni di §9.** Kasus kunci:
  - `allocate` 12 jt → tabel §4.3 persis, dan total = gaji untuk gaji ganjil (mis. 12.345.678).
  - `nextDue` 31 Jan → 28 Feb → 31 Mar, dan 29 Feb tahunan.
  - Periode dengan gaji telat atau lebih awal.
  - `monthlyNeed` saat due date bulan ini atau sudah lewat.
  - Urutan notifikasi.
- **Advisor Supabase** (security + performance) setelah migration.
- **Verifikasi browser** di build produksi lokal dengan akun `smoke@tamoney.test`:
  - Catat gaji 12 jt → 11 pos sesuai tabel.
  - Tambah tagihan jatuh tempo besok → muncul di lonceng → Bayar → transaksi tercatat dan jatuh tempo maju.
  - Buat goal → Setor → progres naik dan saldo dompet berpindah.
  - Ubah persen di Pengaturan (total ≠ 100% menolak simpan).
  - Mobile 375px dan mode gelap.

## 11. Urutan pembangunan (satu commit per irisan)

1. Migration + seed + `lib/budget.ts` + halaman Budget + Catat gaji
2. Pengaturan (persen, kategori per pos, payday)
3. Tagihan rutin + `pay_bill`
4. Goals + setor/tarik
5. Panel notifikasi + kartu Ringkasan + nav
6. Dokumen vault (database, screens, prd, memory)

## 12. Di luar cakupan

- Push notification.
- Transaksi tagihan otomatis.
- Rollover sisa budget otomatis (hanya ajakan pindah ke goal).
- Budget mingguan.
- Banyak gaji per bulan: bonus dicatat sebagai income biasa, tanpa periode.
- Shortcut Siri untuk gaji/tagihan.
