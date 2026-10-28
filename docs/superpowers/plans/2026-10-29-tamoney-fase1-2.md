# TaMoney Fase 1 + 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web app TaMoney (catat transaksi, dashboard, analitik bulanan & kategori, riwayat, kelola wallet + transfer) dengan login, data di Supabase, deploy di Vercel.

**Architecture:** Next.js App Router; halaman = Server Components yang query Supabase, mutasi = Server Actions + `revalidatePath`. Supabase Auth via `@supabase/ssr` cookie; RLS di semua tabel; saldo wallet dari view `wallet_balances`. Logika angka (rupiah, agregasi) di fungsi murni `lib/` yang dites Vitest.

**Tech Stack:** Next.js 16 (TypeScript, App Router), Tailwind CSS 4, @supabase/ssr + @supabase/supabase-js, Zod 4, Recharts 3, Vitest, Supabase CLI, Vercel CLI.

**Spec:** `docs/superpowers/specs/2026-10-29-tamoney-fase1-2-design.md` — baca dulu, plan ini merujuk ke § di sana.

## Global Constraints

- Nama app di UI: **TaMoney** (jangan pernah "FinFlow").
- Semua teks UI Bahasa Indonesia.
- Uang: `bigint` rupiah utuh di DB, `number` di TS; tampil `Rp 1.250.000` (titik pemisah ribuan) dengan font JetBrains Mono + `tabular-nums`.
- Zona waktu pengelompokan hari/bulan: `Asia/Jakarta`.
- Nominal valid: bilangan bulat > 0 dan ≤ 1.000.000.000.000.
- Transfer tidak pernah dihitung sebagai pemasukan/pengeluaran.
- Wallet tidak pernah dihapus; hanya `archived_at`.
- Token desain dari `docs/knowledge/design-system.md` (warna, Plus Jakarta Sans + JetBrains Mono, radius: kartu `rounded-2xl`, tombol `rounded-full`, input `rounded-xl`).
- Breakpoint mobile: < 768px → bottom nav + FAB.
- Hanya `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`; tidak ada service role key di app.
- Next 16: file middleware bernama `proxy.ts` (export `proxy`), bukan `middleware.ts`.
- `docs/knowledge/` adalah vault Obsidian: setiap perubahan dokumen ikut konvensi di Task 1 (frontmatter, wikilink, embed); keputusan baru dicatat di `docs/knowledge/memory/`.

## Review Focus

1. Transaksi pukul 23:30 WIB tanggal terakhir bulan (16:30 UTC) harus masuk hari & bulan WIB itu, bukan bulan berikutnya/sebelumnya → test di Task 4.
2. Wallet diarsipkan: tidak muncul di dropdown/total, tapi transaksi lamanya tetap di riwayat dan masih bisa diedit/dihapus; memilihnya untuk transaksi **baru** ditolak → test validasi di Task 3 + cek manual Task 7.
3. Input nominal ketikan/tempelan: `"1.250.000"`, `"Rp 50.000"`, `" 20000 "` → angka; `"1,5"`, `"abc"`, `""`, `"0"` → ditolak dengan pesan, bukan NaN tersimpan → test di Task 2 & 3.
4. User B mengirim `wallet_id`/`category_id` milik user A lewat server action yang dipalsukan → ditolak (RLS + cek kepemilikan) → cek manual dua akun di Task 10.
5. Klik "Simpan" dua kali cepat → hanya satu transaksi tersimpan (tombol disabled saat pending) → cek manual Task 8.

---

### Task 1: Knowledge base (Obsidian vault) & aset Stitch

**Files:**
- Create: `docs/knowledge/README.md` (MOC / home note), `prd.md`, `design-system.md`, `screens.md`, `architecture.md`, `database.md`, `deployment.md`
- Create: `docs/knowledge/memory/` — satu catatan per keputusan/fakta proyek (lihat Step 0)
- Create: `docs/knowledge/stitch/{dashboard-catat,analitik-riwayat,dompet,ai-pengaturan}.{png,html}`
- Create: `docs/knowledge/.obsidian/app.json` (minimal: `{"attachmentFolderPath":"stitch","newLinkFormat":"shortest","useMarkdownLinks":false}`)
- Create: `CLAUDE.md`
- Modify: `.gitignore` → abaikan `docs/knowledge/.obsidian/workspace*.json`

**Interfaces:**
- Produces: `docs/knowledge/design-system.md` (token yang dipakai Task 2), `docs/knowledge/database.md` (diperbarui di Task 3).

**Konvensi Obsidian (berlaku untuk semua catatan di vault, termasuk yang diperbarui task berikutnya):**
- Frontmatter YAML di setiap catatan: `title`, `tags` (mis. `[tamoney, design]`), `updated: YYYY-MM-DD`; catatan memory tambah `type: decision | constraint | fact`.
- Antar-catatan pakai wikilink `[[database]]`, `[[design-system#Colors]]`; gambar pakai embed `![[dashboard-catat.png]]`.
- `README.md` adalah MOC: daftar semua catatan + bagian "Memory" yang menautkan semua catatan di `memory/`.
- Nama file kebab-case, tanpa spasi.

- [ ] **Step 0:** Buat `docs/knowledge/memory/` berisi satu catatan per keputusan dari spec §2 dan §4 (mis. `scope-fase-1-2.md`, `brand-tamoney.md`, `no-bank-sync-no-ai-yet.md`, `money-bigint-rupiah.md`, `wallet-archive-not-delete.md`, `balance-from-view.md`, `timezone-wib.md`, `transfer-not-income-expense.md`, `mobile-fab-bottom-nav.md`, `stitch-project-source.md`). Format: frontmatter + 1–3 kalimat fakta + `**Why:**` + `**How to apply:**` + wikilink ke catatan terkait. Task berikutnya menambah catatan memory baru bila membuat keputusan yang tidak ada di spec.
- [ ] **Step 1:** Salin aset Stitch dari scratchpad sesi (`…/scratchpad/stitch/*.png|html`, nama di atas). Jika scratchpad hilang, unduh ulang lewat Stitch MCP `list_screens` project `15030374646572842565` (download URL butuh header `X-Goog-Api-Key`; isi file JSON `{dataString}` — PNG base64, HTML teks).
- [ ] **Step 2:** Tulis `prd.md` = PRD user apa adanya (Fase 1–4) + kolom status per fitur (`Fase 1+2: dibangun`, sisanya `belum`).
- [ ] **Step 3:** Tulis `design-system.md` = Stitch DESIGN.md (warna, tipografi, bentuk, komponen) + bagian "Penyesuaian TaMoney": nama TaMoney, aturan mobile (bottom nav, FAB, bottom sheet), elemen yang dihilangkan (spec §2).
- [ ] **Step 4:** Tulis `screens.md` = per layar Stitch: route, komponen, dibangun/dihilangkan (dari spec §5), embed screenshot `stitch/*.png`.
- [ ] **Step 5:** Tulis `architecture.md` (spec §3), `database.md` (spec §4), `deployment.md` (spec §9), `README.md` (indeks + "baca ini dulu"), `CLAUDE.md` (beberapa baris: arahkan ke `docs/knowledge/README.md` (vault Obsidian), perintah `npm run dev|test|build`, aturan Global Constraints singkat, dan aturan: "keputusan proyek baru → tulis catatan di `docs/knowledge/memory/` dengan konvensi vault, lalu tautkan di README").
- [ ] **Step 6:** Verifikasi: setiap `[[link]]` di vault menunjuk ke file yang ada (`grep -oh "\[\[[^]|#]*" -r docs/knowledge | sort -u` lalu cek tiap nama punya `.md`/aset yang cocok); setiap catatan diawali frontmatter `---`.
- [ ] **Step 7: Commit** `git add docs/knowledge CLAUDE.md .gitignore && git commit -m "docs: add Obsidian knowledge vault and Stitch references"`

### Task 2: Scaffold Next.js, tema, Vitest, `lib/money.ts`

**Files:**
- Create: project Next.js di root (package.json, `app/`, `tsconfig.json`, …), `app/globals.css`, `app/layout.tsx`, `vitest.config.ts`, `lib/money.ts`, `lib/money.test.ts`, `.env.example`

**Interfaces:**
- Produces: `formatRupiah(n: number): string`, `parseRupiah(input: string): number | null`; kelas Tailwind dari token (`bg-surface`, `text-on-surface`, `bg-primary`, `text-positive`, `text-negative`, `bg-tertiary-container`, `font-mono`, dll.); script `npm test`.

- [ ] **Step 1:** `npx create-next-app@16 . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm` (direktori sudah berisi `docs/` — jika ditolak, scaffold di folder sementara lalu pindahkan). `npm i -D vitest` ; script `"test": "vitest run"`.
- [ ] **Step 2:** `app/globals.css`: blok `@theme` Tailwind 4 berisi warna dari `design-system.md` (pakai set "Colors" di prosa: primary `#1E3A8A`, primary-container `#DBEAFE`, primary-fixed `#0A192F`, positive `#059669`/`#D1FAE5`/`#065F46`, negative `#E11D48`/`#FFE4E6`/`#9F1239`, tertiary `#6366F1`/`#EEF2FF`/`#3730A3`, surface `#F8FAFC`, surface-dim `#F1F5F9`, outline `#CBD5E1`, outline-variant `#E2E8F0`, on-surface `#0F172A`, on-surface-variant `#64748B`), font `--font-sans`/`--font-mono`. `app/layout.tsx`: `lang="id"`, `next/font/google` Plus Jakarta Sans + JetBrains Mono, link Material Symbols Outlined, `metadata.title = "TaMoney"`.
- [ ] **Step 3: Write failing test** `lib/money.test.ts`:

```ts
expect(formatRupiah(1250000)).toBe("Rp 1.250.000");
expect(formatRupiah(0)).toBe("Rp 0");
expect(formatRupiah(-45000)).toBe("-Rp 45.000");
expect(parseRupiah("1.250.000")).toBe(1250000);
expect(parseRupiah("Rp 50.000")).toBe(50000);
expect(parseRupiah(" 20000 ")).toBe(20000);
for (const bad of ["", "abc", "1,5", "12.5a"]) expect(parseRupiah(bad)).toBeNull();
```

- [ ] **Step 4:** Run `npm test` → FAIL (module not found).
- [ ] **Step 5:** Implement di `lib/money.ts` (strip `Rp`, spasi, titik; sisanya harus `^\d+$`; format manual dengan titik, jangan bergantung pada locale `Intl` yang bisa menghasilkan NBSP).
- [ ] **Step 6:** `npm test` → PASS; `npm run build` → sukses.
- [ ] **Step 7:** `.env.example` dengan dua env var; pastikan `.env*.local` di `.gitignore`. Commit `feat: scaffold Next.js app with TaMoney theme and money utils`.

### Task 3: Skema Supabase, tipe, validasi

**Files:**
- Create: `supabase/config.toml` (via `npx supabase init`), `supabase/migrations/20261029000000_init.sql`, `lib/types.ts`, `lib/validation.ts`, `lib/validation.test.ts`
- Modify: `docs/knowledge/database.md` (jika ada perbedaan dari spec)

**Interfaces:**
- Produces (`lib/types.ts`): `type TxKind = "income" | "expense" | "transfer"`; `type WalletType = "cash" | "bank" | "ewallet" | "other"`; `Wallet { id; name; type: WalletType; initial_balance: number; archived_at: string | null; balance: number }`; `Category { id; kind: "income" | "expense"; name; icon }`; `Tx { id; kind: TxKind; amount: number; wallet_id; to_wallet_id: string | null; category_id: string | null; note: string | null; occurred_at: string }`.
- Produces (`lib/validation.ts`): `txSchema` (fields `kind: "income"|"expense"`, `amount`, `wallet_id`, `category_id`, `note?`, `occurred_at` `YYYY-MM-DD`), `transferSchema` (`amount`, `wallet_id`, `to_wallet_id`, `note?`, `occurred_at`), `walletSchema` (`name`, `type`, `initial_balance`). `amount` diterima sebagai string/number dan di-`parseRupiah`. Pesan error Bahasa Indonesia.

- [ ] **Step 1:** Tulis migrasi sesuai spec §4 persis: enum `wallet_type`, `category_kind`, `tx_kind`; tabel `profiles`, `wallets`, `categories`, `transactions` dengan check constraint (amount > 0 dan ≤ 1e12, aturan transfer vs income/expense, `to_wallet_id <> wallet_id`, panjang name ≤ 50, note ≤ 200); index `(user_id, occurred_at desc)`; RLS + 4 policy `user_id = auth.uid()` per tabel (profiles pakai `id`); view `wallet_balances` `with (security_invoker = true)`; fungsi `handle_new_user()` `security definer set search_path = ''` yang insert profile (display_name dari `raw_user_meta_data->>'display_name'`) + 11 kategori bawaan (spec §4, ikon Material Symbols: restaurant, directions_car, shopping_bag, bolt, movie, medical_services, more_horiz, payments, redeem, trending_up, more_horiz) + trigger `after insert on auth.users`.
- [ ] **Step 2:** Jika Docker jalan: `npx supabase start && npx supabase db reset` → migrasi sukses. Jika tidak, tandai untuk diverifikasi di Task 10.
- [ ] **Step 3: Write failing test** `lib/validation.test.ts`:

```ts
expect(txSchema.safeParse({ kind:"expense", amount:"50.000", wallet_id:UUID, category_id:UUID, occurred_at:"2026-10-29" }).data?.amount).toBe(50000);
for (const amount of ["0", "1,5", "", "abc", "1000000000001"]) expect(txSchema.safeParse({ ...ok, amount }).success).toBe(false);
expect(transferSchema.safeParse({ ...okTransfer, to_wallet_id: okTransfer.wallet_id }).success).toBe(false);
expect(walletSchema.safeParse({ name:"", type:"cash", initial_balance:"0" }).success).toBe(false);
expect(walletSchema.safeParse({ name:"x".repeat(51), type:"cash", initial_balance:"0" }).success).toBe(false);
```

- [ ] **Step 4:** `npm test` → FAIL. Implement `lib/types.ts`, `lib/validation.ts`. `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: add Supabase schema, RLS, types and input validation`.

### Task 4: Agregasi laporan `lib/reports.ts`

**Files:**
- Create: `lib/reports.ts`, `lib/reports.test.ts`

**Interfaces:**
- Consumes: `Tx` dari `lib/types.ts`.
- Produces: `type ReportTx = Pick<Tx,"kind"|"amount"|"occurred_at"|"category_id"> & { category_name?: string }`;
  `wibDate(iso: string): string` → `"YYYY-MM-DD"`; `monthKey(iso: string): string` → `"YYYY-MM"`;
  `monthRange(month: string): { start: string; end: string }` → ISO UTC batas bulan WIB (`end` eksklusif);
  `shiftMonth(month: string, delta: number): string`;
  `monthTotals(txs: ReportTx[]): { income: number; expense: number; net: number }`;
  `monthlyTrend(txs: ReportTx[], endMonth: string, n = 6): { month: string; income: number; expense: number }[]`;
  `categoryBreakdown(txs: ReportTx[], prevTxs: ReportTx[]): { categoryId: string; name: string; amount: number; share: number; deltaVsPrev: number | null }[]`;
  `pctChange(cur: number, prev: number): number | null` (null bila prev = 0).

- [ ] **Step 1: Write failing tests:**

```ts
expect(wibDate("2026-10-31T16:30:00Z")).toBe("2026-10-31");      // 23:30 WIB
expect(monthKey("2026-10-31T17:30:00Z")).toBe("2026-11");          // 00:30 WIB 1 Nov
expect(monthRange("2026-10")).toEqual({ start:"2026-09-30T17:00:00.000Z", end:"2026-10-31T17:00:00.000Z" });
expect(shiftMonth("2026-01", -1)).toBe("2025-12");
expect(monthTotals([inc(100), exp(40), transfer(500)])).toEqual({ income:100, expense:40, net:60 });
expect(monthlyTrend([exp(10,"2026-10-05")], "2026-10", 3).map(m=>m.month)).toEqual(["2026-08","2026-09","2026-10"]);
// bulan kosong = 0, urutan menaik
const b = categoryBreakdown([exp(300,"A"), exp(100,"B"), inc(999)], [exp(150,"A")]);
expect(b.map(x=>x.name)).toEqual(["A","B"]);
expect(b[0].share).toBeCloseTo(0.75); expect(b[0].deltaVsPrev).toBeCloseTo(1); expect(b[1].deltaVsPrev).toBeNull();
expect(pctChange(110,100)).toBeCloseTo(0.1); expect(pctChange(5,0)).toBeNull();
```

- [ ] **Step 2:** `npm test` → FAIL. Implement (WIB = UTC+7 tetap, tanpa DST — cukup geser 7 jam, tanpa library). `npm test` → PASS.
- [ ] **Step 3: Commit** `feat: add monthly and category report aggregation`.

### Task 5: Supabase client, proxy, halaman auth

**Files:**
- Create: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/proxy.ts`, `proxy.ts`, `app/auth/callback/route.ts`, `app/(auth)/layout.tsx`, `app/(auth)/{masuk,daftar,lupa-password,reset-password}/page.tsx`, `lib/actions/auth.ts`
- Modify: `package.json` (dep `@supabase/ssr`, `@supabase/supabase-js`)

**Interfaces:**
- Produces: `createClient(): Promise<SupabaseClient>` (server, `lib/supabase/server.ts`); `createClient(): SupabaseClient` (browser); `requireUser(): Promise<{ supabase; user }>` di `lib/supabase/server.ts` (redirect `/masuk` bila tidak ada); actions `signIn`, `signUp`, `signOut`, `requestPasswordReset`, `updatePassword` — semua `(prev: ActionState, formData: FormData) => Promise<ActionState>` dengan `type ActionState = { error?: string; ok?: boolean }` (diekspor dari `lib/actions/state.ts`, dipakai semua action).

- [ ] **Step 1:** Install dep; buat klien mengikuti pola resmi `@supabase/ssr` untuk Next.js (cookie `getAll/setAll`).
- [ ] **Step 2:** `proxy.ts`: refresh sesi; tanpa user dan path bukan `/masuk|/daftar|/lupa-password|/reset-password|/auth/*` → redirect `/masuk`; dengan user di halaman auth (kecuali reset-password) → redirect `/`. Matcher kecualikan `_next`, aset statis.
- [ ] **Step 3:** Halaman auth (kartu tengah, logo TaMoney, gaya input/tombol dari design-system) memakai `useActionState`; tombol disabled saat pending. `signUp` mengirim `options.data.display_name` dan `emailRedirectTo: ${origin}/auth/callback`. `requestPasswordReset` → `redirectTo: ${origin}/auth/callback?next=/reset-password`. Terjemahkan error Supabase umum ("Invalid login credentials" → "Email atau password salah", "User already registered" → "Email sudah terdaftar"); lainnya → "Terjadi kesalahan, coba lagi".
- [ ] **Step 4:** `app/auth/callback/route.ts`: `exchangeCodeForSession(code)` lalu redirect ke `next` (hanya path relatif yang diawali `/`) atau `/`.
- [ ] **Step 5:** Verifikasi: `npm run build` sukses; dengan `.env.local` berisi project Supabase (bila sudah ada) daftar → email → masuk → keluar berjalan. Jika belum ada project, verifikasi alur ditunda ke Task 10.
- [ ] **Step 6: Commit** `feat: add Supabase auth with login, signup and password reset`.

### Task 6: App shell & query data

**Files:**
- Create: `app/(app)/layout.tsx`, `components/shell/{Sidebar,TopBar,BottomNav,QuickAddFab,UserMenu}.tsx`, `components/ui/{Dialog,Button,Field,Money,Icon,EmptyState}.tsx`, `lib/queries.ts`

**Interfaces:**
- Consumes: `requireUser`, `formatRupiah`, types.
- Produces (`lib/queries.ts`, semua server-only, menerima `supabase`): `getWallets(sb, { includeArchived?: boolean }): Promise<Wallet[]>` (join `wallet_balances`, urut `created_at`); `getCategories(sb): Promise<Category[]>`; `getTransactionsBetween(sb, startIso: string, endIso: string): Promise<(Tx & { category_name: string | null })[]>`; `getProfile(sb): Promise<{ display_name: string | null }>`.
- Produces (UI): `<Money value={number} sign?="auto"|"none" className? />` (mono, tabular, hijau/merah bila `sign="auto"`); `<Dialog open onClose title>` (desktop: modal tengah; < 768px: bottom sheet); `<Icon name="..."/>` (Material Symbols); `QuickAddFab` merender tombol + dialog berisi `children` (diisi `TxForm` di Task 8 — sementara placeholder "Segera").

- [ ] **Step 1:** Layout `(app)`: `requireUser()`, ambil profile; sidebar 280px kiri (≥ 768px; nav Dashboard `/`, Analitik & Riwayat `/analitik`, Kelola Dompet `/dompet`, aktif = `bg-primary text-white rounded-xl`), top bar (tombol "Catat Transaksi", avatar inisial + `UserMenu` dengan Keluar). < 768px: sidebar & tombol top bar disembunyikan, `BottomNav` fixed bawah + FAB di atasnya. Sesuaikan dengan screenshot `docs/knowledge/stitch/dashboard-catat.png` (tanpa kotak search, lonceng, "Status Dompet", versi).
- [ ] **Step 2:** `lib/queries.ts` sesuai interface (lempar error bila Supabase mengembalikan error; `error.tsx` di `app/(app)/` menampilkan pesan + tombol coba lagi).
- [ ] **Step 3:** Verifikasi `npm run dev`: di 1280px sidebar tampil; di 375px bottom nav + FAB tampil, tidak ada scroll horizontal. `npm run build` sukses.
- [ ] **Step 4: Commit** `feat: add app shell with responsive navigation`.

### Task 7: Kelola Dompet + transfer

**Files:**
- Create: `lib/actions/wallets.ts`, `lib/actions/transfers.ts`, `app/(app)/dompet/page.tsx`, `components/wallets/{WalletCard,WalletForm,ArchivedList,TransferForm,TransferLog}.tsx`

**Interfaces:**
- Consumes: `walletSchema`, `transferSchema`, `getWallets`, `getTransactionsBetween`, `ActionState`.
- Produces: `createWallet`, `updateWallet` (formData berisi `id`), `setWalletArchived(id: string, archived: boolean): Promise<ActionState>`, `saveTransfer` (create bila tanpa `id`, update bila ada), `deleteTransaction(id: string): Promise<ActionState>` (di `lib/actions/transactions.ts`, dipakai juga Task 8–9). Setiap mutasi `revalidatePath("/", "layout")`. `<TransferForm wallets={Wallet[]} initial?={Tx} onDone? />`.

- [ ] **Step 1:** Actions: validasi Zod; untuk transfer, cek kedua wallet milik user dan belum diarsipkan (query `wallets` id in […] dengan `archived_at is null`; jumlah baris harus 2) kecuali saat update dan wallet tidak berubah. Error → `{ error }` Bahasa Indonesia.
- [ ] **Step 2:** Halaman sesuai `stitch/dompet.png` dan spec §5 Kelola Dompet: ringkasan (total saldo aktif, jumlah aktif, jumlah diarsipkan), grid kartu wallet (wallet pertama gaya navy "utama", lainnya putih) dengan menu Ubah/Arsipkan, kartu "Tambah Wallet", form transfer (dropdown hanya wallet aktif), log 10 transfer terakhir (ambil transaksi `kind = transfer` urut `occurred_at desc` limit 10), daftar Diarsipkan dengan Pulihkan.
- [ ] **Step 3:** Verifikasi manual: tambah 2 wallet (saldo awal 100.000 & 0) → transfer 30.000 → saldo 70.000 & 30.000; transfer ke wallet sama ditolak; arsipkan wallet kedua → hilang dari total & dropdown, muncul di Diarsipkan; pulihkan → kembali.
- [ ] **Step 4: Commit** `feat: add wallet management and transfers`.

### Task 8: Catat transaksi + Dashboard

**Files:**
- Create: `lib/actions/transactions.ts` (+ `deleteTransaction` jika belum), `components/transactions/{TxForm,TxRow}.tsx`, `components/dashboard/{SummaryCards,WalletStrip,TodayActivity}.tsx`, `app/(app)/page.tsx`
- Modify: `app/(app)/layout.tsx` (FAB & tombol top bar memakai `TxForm`)

**Interfaces:**
- Consumes: `txSchema`, queries, `reports.monthTotals`, `monthRange`, `monthKey`, `wibDate`, `Money`, `Dialog`.
- Produces: `saveTransaction` (create/update by `id`); `<TxForm wallets categories initial?={Tx} onDone? />`; `<TxRow tx onEdit? onDelete? />` (ikon kategori, nama kategori/catatan, nama wallet chip, jam WIB, nominal +/−; transfer: "A → B").

- [ ] **Step 1:** `saveTransaction`: validasi; cek wallet milik user dan belum diarsipkan (kecuali update dengan wallet yang sama), kategori milik user dan `kind` sama dengan transaksi; `occurred_at` = tanggal input + jam sekarang WIB (atau jam asli saat update bila tanggal tidak berubah).
- [ ] **Step 2:** `TxForm` sesuai panel "Catat Singkat" di `stitch/dashboard-catat.png`: toggle Pengeluaran/Pemasukan (mengganti daftar kategori), chip 20rb/50rb/100rb/500rb menambah ke nominal, input nominal dengan prefix `Rp` (tampil berformat titik saat diketik), select Dompet (aktif saja), select Kategori, catatan, tanggal (default hari ini WIB), tombol "Simpan Transaksi" disabled saat pending; sukses → reset form + `onDone`. Tanpa wallet → pesan "Buat dompet dulu" + link `/dompet`.
- [ ] **Step 3:** Dashboard: sapaan berdasarkan jam WIB (Pagi < 11, Siang < 15, Sore < 18, Malam) + nama, tanggal; `SummaryCards` (Saldo Total, Pemasukan & Pengeluaran bulan ini); `WalletStrip`; `TodayActivity` (transaksi `wibDate === hari ini`, terbaru dulu, link "Lihat Semua"); `TxForm` di kolom kanan ≥ 1280px. Pengguna tanpa wallet → `EmptyState` "Buat dompet pertama".
- [ ] **Step 4:** Verifikasi manual (desktop & 375px): catat pengeluaran 45.000 → muncul di Aktivitas Hari Ini, Pengeluaran bulan ini & saldo wallet berubah; FAB di `/dompet` membuka bottom sheet dan menyimpan; double-click Simpan → hanya 1 baris.
- [ ] **Step 5: Commit** `feat: add quick transaction entry and dashboard`.

### Task 9: Analitik & Riwayat

**Files:**
- Create: `app/(app)/analitik/page.tsx`, `components/analytics/{MonthPicker,TotalsCards,TrendChart,CategoryDonut,CategoryRanking,HistoryTable,HistoryFilters}.tsx`

**Interfaces:**
- Consumes: `monthRange`, `shiftMonth`, `monthTotals`, `monthlyTrend`, `categoryBreakdown`, `pctChange`, `getTransactionsBetween`, `TxRow`, `TxForm`, `TransferForm`, `deleteTransaction`.
- Produces: halaman `/analitik?bulan=YYYY-MM&q=&dompet=&kategori=&jenis=all|income|expense|transfer&hal=1`.

- [ ] **Step 1:** Server page: parse `bulan` (default bulan WIB sekarang; format tidak valid → default). Ambil transaksi 6 bulan (`monthRange(shiftMonth(bulan,-5)).start` s/d `monthRange(bulan).end`) dalam satu query; turunkan bulan ini, bulan lalu, tren dari situ.
- [ ] **Step 2:** `TotalsCards` (Pemasukan, Pengeluaran, Selisih + `pctChange` vs bulan lalu; null → "—"), `TrendChart` (Recharts BarChart, hijau `positive`, merah `negative`, label bulan "Jan", "Feb" …), `CategoryDonut` + `CategoryRanking` (nama, `Money`, persen, delta vs bulan lalu ▲/▼), sesuai `stitch/analitik-riwayat.png`. Bulan tanpa pengeluaran → `EmptyState`.
- [ ] **Step 3:** `HistoryFilters` (client, update query string): cari (cocokkan `note` atau `category_name`, case-insensitive), dompet, kategori, jenis Semua/Masuk/Keluar/Transfer. `HistoryTable`: filter di server, 20 per halaman, tabel ≥ 768px / daftar `TxRow` < 768px; aksi Edit (dialog `TxForm` atau `TransferForm` sesuai `kind`) dan Hapus (konfirmasi `window.confirm`-gaya dialog "Hapus transaksi ini?").
- [ ] **Step 4:** Verifikasi manual: data 2 bulan → tren & persen benar; filter + cari menyaring; edit nominal → kartu & dashboard ikut berubah; hapus → hilang; transaksi wallet diarsipkan masih tampil dan bisa diedit.
- [ ] **Step 5: Commit** `feat: add monthly analytics, category breakdown and transaction history`.

### Task 10: Supabase & Vercel deployment

**Files:**
- Modify: `docs/knowledge/deployment.md` (URL & langkah aktual), `README.md` (root: ringkas + link ke knowledge)

**Interfaces:**
- Consumes: semua task sebelumnya.

- [ ] **Step 1 (user):** Buat project Supabase; jalankan `npx supabase login`. Buat akun Vercel; `npx vercel login`. Buat repo GitHub dan push (`gh auth login` bila perlu).
- [ ] **Step 2:** `npx supabase link --project-ref <ref>` → `npx supabase db push` → migrasi diterapkan. Isi `.env.local` dengan URL & anon key project.
- [ ] **Step 3:** `npx vercel link` → `npx vercel env add NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production + preview) → `npx vercel --prod`. Di Supabase Auth → URL Configuration: Site URL = domain Vercel; Redirect URLs + `https://<domain>/auth/callback` dan `http://localhost:3000/auth/callback`.
- [ ] **Step 4:** Smoke test di URL produksi (desktop & HP): daftar → verifikasi email → buat wallet → catat → analitik. Review Focus #4: akun B tidak melihat data akun A; memanggil `saveTransaction` dengan `wallet_id` milik A (ubah value `<option>` lewat devtools) → ditolak.
- [ ] **Step 5:** Perbarui `deployment.md` + `README.md`; `npm test && npm run build` → PASS. Commit `docs: record deployment setup`.
