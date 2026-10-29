# Budget Gajian, Tagihan Rutin, Goals & Notifikasi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a payday budget (salary split into budget pos by percentage), recurring bills with one-tap pay, wallet-linked savings goals, an in-app notification panel, and a Pengaturan page for budget percentages.

**Architecture:** One Supabase migration adds the tables, seed data and two atomic RPCs (`record_salary`, `pay_bill`). All rules (allocation, due dates, goal math, notifications) live in pure, Vitest-tested modules under `lib/`. Pages are Server Components reading through one cached `getPlanningState`; mutations are Server Actions that call `revalidatePath("/", "layout")`.

**Tech Stack:** Next.js 16 App Router, Supabase (`@supabase/ssr`, Postgres RLS), Tailwind 4, `motion/react`, zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-29-budget-tagihan-goals-design.md`. Read it first; section numbers below (§) point into it.

## Global Constraints

- UI copy is Bahasa Indonesia. The product name is TaMoney.
- Money is a whole-rupiah integer (`bigint` in DB, `number` in TS). Format with `formatRupiah` and parse with `parseRupiah` from `lib/money.ts`.
- Dates are `YYYY-MM-DD` in Asia/Jakarta. Today is `todayWib()`; convert a date to a timestamp with `toOccurredAt` (`lib/reports.ts`).
- Transfers are never income or expense. Goal deposits and withdrawals are `kind = 'transfer'` with `goal_id`.
- Wallets, bills and goals are archived, never deleted.
- Every new table:
  - RLS policy `for all to authenticated using/with check (user_id = (select auth.uid()))`.
  - `revoke all … from anon`.
  - Composite owner FK `(x_id, user_id)`.
  - An index per FK.
- RPCs: `security invoker`, `set search_path = ''`, `revoke execute … from public, anon`, `grant execute … to authenticated`.
- UI uses only the core components:
  - `Button` (lg/md/sm) and `IconButton` (`tone`)
  - `Field` / `Input` / `AmountInput`
  - `Picker`, `DateField`, `Popover`, `Dialog`, `useConfirm`, `Segmented`
  - `MultiSelect` from `components/analytics/Filters.tsx`
  - `EmptyState`, `Skeleton`

  No native `<select>`, date input or `confirm()`. Animation goes through `motion/react` with the springs already used in the repo.
- Default budget pos and basis points are exactly the §4.3 table.
- Code style follows the Ponytail skill (`.claude/skills/ponytail`): smallest change, comments only for the non-obvious.
- No deploy. Commit after each task on branch `feat/fase-1-2`.
- Supabase project `lunelnmwgcccapnjolht`. Apply the migration via the Supabase MCP `apply_migration` and also save it to `supabase/migrations/`.

## Review Focus

- **Same month's salary entered twice:** it must update that month's period and its income transaction, never create a second period. Pinned in Task 3 (`record_salary` called twice).
- **Double-tap on "Bayar":** must record one expense and advance once. `pay_bill` takes the due date the user saw and fails if `next_due` already moved. Pinned in Task 6.
- **Bill or goal whose wallet was archived since:** Bayar and Setor must refuse with the existing "dompet diarsipkan" message, via `walletError`. Pinned in Tasks 6 and 8 action tests.
- **Percentages not summing to 100%, or a negative/over-100 value:** the server rejects it; the UI blocks Simpan. Pinned in Task 4 (`budgetSettingsSchema`).
- **Monthly bill on the 31st:** goes 31 Jan → 28/29 Feb → 31 Mar, in both `nextDue` (TS) and `pay_bill` (SQL). Pinned in Task 5 and the SQL check in Task 6.

---

### Task 1: Migration — schema, seed, RPCs

**Files:**
- Create: `supabase/migrations/20261029060000_budget_bills_goals.sql`
- Modify: `lib/types.ts` (add types below)
- Modify: `components/ui/MonthGrid.tsx`, `components/ui/DateField.tsx` (add `max` prop)

**Interfaces:**
- Produces, as DB objects:
  - Columns: `profiles.payday_day`, `categories.budget_group_id`, `transactions.goal_id`, `transactions.bill_id`.
  - Tables: `budget_groups`, `budget_periods`, `budget_allocations`, `goals`, `bills`.
  - Enum `bill_cadence`.
  - RPCs `record_salary`, `pay_bill`.
- Produces in `lib/types.ts`:
  ```ts
  export type BudgetGroup = { id: string; name: string; icon: string; pct_bp: number; is_savings: boolean; sort: number };
  export type BudgetPeriod = { id: string; month: string; start_date: string; salary: number; income_tx_id: string | null; allocations: Record<string, number> };
  export type Cadence = "weekly" | "monthly" | "yearly";
  export type Bill = { id: string; name: string; icon: string; amount: number; category_id: string; wallet_id: string; cadence: Cadence; due_day: number | null; next_due: string; remind_days: number; archived_at: string | null };
  export type Goal = { id: string; name: string; icon: string; target: number; initial_amount: number; due_date: string | null; monthly_amount: number | null; wallet_id: string; source_wallet_id: string | null; achieved_at: string | null; archived_at: string | null; created_at: string };
  // Category gains: budget_group_id: string | null
  // Tx gains: goal_id: string | null; bill_id: string | null
  ```
- Produces: `MonthGrid` / `DateField` prop `max?: string | null`.
  - Default: today (current behavior).
  - `null`: no upper bound. The "Bulan berikutnya" button and future days are enabled.

- [ ] **Step 1: Write the migration.** Columns and checks exactly per spec §3. Specifics:
  - `budget_groups`: `unique (user_id, name)`, `unique (id, user_id)`, `pct_bp int not null check (pct_bp between 0 and 10000)`. Add a partial unique index `on budget_groups (user_id) where is_savings` (exactly one savings pos per user).
  - `categories.budget_group_id`: FK `(budget_group_id, user_id) references budget_groups (id, user_id) on delete set null (budget_group_id)`.
  - `budget_periods`: `unique (user_id, month)`, `check (extract(day from month) = 1)`. Income tx FK `(income_tx_id, user_id) … on delete set null (income_tx_id)`.
  - `budget_allocations`:
    - Columns: `user_id` (default `auth.uid()`), `period_id`, `group_id`, `amount bigint not null check (amount >= 0)`.
    - Primary key `(period_id, group_id)`.
    - Owner FKs to both parents, `on delete cascade`.
  - `goals` and `bills` get `unique (id, user_id)`. Wallet and category FKs are owner-scoped `on delete restrict`.
  - `transactions`: `add goal_id`, `add bill_id`, owner FKs `on delete restrict`, and these checks:
    - `check (goal_id is null or kind = 'transfer')`
    - `check (bill_id is null or kind = 'expense')`
  - Seed function `public.seed_budget(uid uuid)`:
    - `security definer`, execute revoked from everyone.
    - Inserts categories Groceries / Kost & Rumah / Langganan (`on conflict do nothing`).
    - Inserts the 11 pos from §4.3 with `sort` 0..10.
    - Sets `categories.budget_group_id` by the name map in §3.
  - Call `seed_budget` for every existing `profiles.id`. Add a call to it at the end of `handle_new_user` (`create or replace`, keeping the existing body).
  - `record_salary(p_month date, p_salary bigint, p_wallet uuid, p_occurred_at timestamptz, p_allocations jsonb)` returns uuid (the period id). It:
    - Raises `'alokasi tidak sama dengan gaji'` if the sum of `p_allocations` values ≠ `p_salary`.
    - Finds the user's income category named `Gaji`. If missing, inserts it with icon `payments`.
    - If a period exists for `p_month`:
      - Updates the salary and `start_date = p_occurred_at at time zone 'Asia/Jakarta'`.
      - Updates the linked income transaction (amount, wallet, occurred_at), or inserts one if the link is null.
      - Replaces the allocations.
    - Otherwise inserts the transaction, the period and the allocations.
  - `pay_bill(p_bill uuid, p_due date, p_amount bigint, p_wallet uuid, p_occurred_at timestamptz)` returns void. It:
    - Selects the bill `for update`.
    - Raises `'tagihan sudah dibayar'` if `next_due <> p_due`.
    - Inserts an expense with the bill's `category_id`, `bill_id`, and note = bill name.
    - Sets `next_due` by the §5 rule:
      - weekly: `+ 7`.
      - monthly: next month's `make_date` with day `least(due_day, last day of month)`.
      - yearly: same, twelve months on.
  - Add `skip_bill(p_bill uuid, p_due date)`: the same guard and advance, with no transaction.
- [ ] **Step 2: Apply it.** Use MCP `apply_migration` with name `budget_bills_goals`. Then run `get_advisors` for both `security` and `performance`. Expected: no new warnings for the new tables or functions.
- [ ] **Step 3: Check the seed.** Run via `execute_sql`:
  ```sql
  select g.name, g.pct_bp, array_agg(c.name) from budget_groups g left join categories c on c.budget_group_id = g.id join profiles p on p.id = g.user_id where p.display_name ilike 'tama%' group by 1,2 order by min(g.sort);
  ```
  Expected:
  - 11 rows with bp `3333,2000,1500,750,500,500,417,333,250,250,167`.
  - Rumah & Kost → {Kost & Rumah, Tagihan & Utilitas}.
  - Gereja & Sosial → {Gereja}.
  - Lain-lain → {Lainnya, Tarik Tunai}.
  - `sum(pct_bp) = 10000`.
- [ ] **Step 4: Check the SQL date rule.** In `execute_sql`, run inside `begin … rollback`:
  - Insert a monthly bill with `due_day 31`, `next_due '2027-01-31'` for the smoke user.
  - Call `skip_bill` three times, passing the current `next_due` each time.
  - Expected `next_due` sequence: `2027-02-28`, `2027-03-31`, `2027-04-30`.
- [ ] **Step 5: Add the types** and the `max` prop on `MonthGrid` / `DateField`. Run `npx tsc --noEmit` and `npm test`. Expected: clean, 55 passing.
- [ ] **Step 6: Commit**: `feat: schema for budget periods, bills and goals`.

### Task 2: `lib/budget.ts`

**Files:**
- Create: `lib/budget.ts`, `lib/budget.test.ts`

**Interfaces:**
- Consumes: `BudgetGroup`, `BudgetPeriod`, `ReportTx`-like rows `{ kind, amount, occurred_at, category_id, goal_id, wallet_id, to_wallet_id }`.
- Produces:
  ```ts
  export const DEFAULT_POS: { name: string; icon: string; pct_bp: number; is_savings: boolean }[]; // §4.3, same order as seed
  export function allocate(salary: number, groups: Pick<BudgetGroup, "id" | "pct_bp" | "is_savings">[]): Record<string, number>;
  export function nominalEnd(start: string, payday: number): string;          // day before payday of the following month
  export function periodRange(periods: BudgetPeriod[], i: number): { start: string; end: string | null }; // end = day before next period's start_date, null if latest
  export type PosUsage = { group: BudgetGroup; limit: number; used: number; left: number; pct: number; level: "ok" | "warn" | "over" | "saved" };
  export function usage(groups: BudgetGroup[], period: BudgetPeriod, rows: UsageRow[], catGroup: Record<string, string | null>, goalWallets: Record<string, string>): { pos: PosUsage[]; unassigned: number; spent: number };
  export function safePerDay(pos: PosUsage[], today: string, end: string): number; // sum(left of non-savings, ≥0) / days remaining incl. today, floored
  ```
  Usage counts:
  - Expenses on categories mapped to the pos.
  - For the savings pos: goal transfers into the goal's wallet minus goal transfers out of it.

  Levels:
  - `ok`: <80%.
  - `warn`: ≥80%.
  - `over`: >100%.
  - Savings pos: `saved` when used ≥ limit, else `ok`.

- [ ] **Step 1: Write failing tests**
  - `allocate(12_000_000, defaults)` → savings 4_000_000, Rumah 2_400_000, Makanan 1_800_000, Groceries 900_000, Transportasi 600_000, Belanja 600_000, Kesehatan 500_000, Hiburan 400_000, Langganan 300_000, Gereja 300_000, Lain-lain 200_000.
  - `allocate(12_345_678, defaults)`: values sum to 12_345_678, and every non-savings value is a multiple of 10_000.
  - `allocate(1_000_000, [{a: 9000}, {b: 5000}, {s: 0, savings}])`: no negative values, savings = 0, sum = 1_000_000. Over-allocation is trimmed from the largest pos.
  - `nominalEnd("2026-10-25", 25)` = `"2026-11-24"`. `nominalEnd("2027-01-25", 25)` = `"2027-02-24"`.
  - `periodRange([oct@2026-10-25, nov@2026-11-27], 0)` = `{start: "2026-10-25", end: "2026-11-26"}` (a late salary extends the old period).
  - `usage`:
    - An expense on Makan & Minum counts in Makanan.
    - An expense on an unmapped category goes to `unassigned`.
    - A goal transfer counts in savings.
    - A plain transfer counts nowhere.
    - A Makanan pos at 1_500_000 / 1_800_000 has level `warn`.
  - `safePerDay`: 600_000 left with 6 days remaining → 100_000.
- [ ] **Step 2:** `npx vitest run lib/budget.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement.** Use the §4.3 rounding: `Math.round(salary * bp / 10000 / 10000) * 10000`. The savings pos gets the remainder. If the remainder is negative, subtract from the largest non-savings pos (repeat) until savings = 0. Dates use `addDays` from `lib/period.ts`.
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5: Commit**: `feat: budget allocation and usage rules`.

### Task 3: Budget page + Catat gaji

**Files:**
- Create:
  - `lib/planning.ts` (data loading)
  - `lib/actions/budget.ts`
  - `app/(app)/budget/page.tsx`, `app/(app)/budget/loading.tsx`
  - `components/budget/BudgetView.tsx`, `components/budget/SalaryForm.tsx`, `components/budget/PosRow.tsx`
- Modify:
  - `lib/validation.ts` (`salarySchema`)
  - `components/shell/Nav.tsx` (add `{ href: "/budget", label: "Budget", icon: "pie_chart" }` after Ringkasan)

**Interfaces:**
- Consumes: Task 2 functions, `getWallets`, `getCategories`, `fetchAllPages`.
- Produces:
  ```ts
  // lib/planning.ts — cache()d per request
  export type PlanningState = { payday: number; groups: BudgetGroup[]; periods: BudgetPeriod[]; current: { period: BudgetPeriod; range: { start: string; end: string | null }; usage: ReturnType<typeof usage> } | null; bills: Bill[]; goals: GoalWithProgress[] };
  export const getPlanningState: (sb: Supabase) => Promise<PlanningState>;
  // lib/actions/budget.ts
  export async function recordSalary(_: ActionState, fd: FormData): Promise<ActionState>;
  ```
  - In this task, `bills`/`goals` are `[]`. Tasks 6 and 8 fill them in.
  - `getPlanningState` fetches the current period's transactions once, from `start` to today (end of day WIB), using the `isoRange` helper.
  - `salarySchema` fields: `month` (`YYYY-MM`), `amount` (rupiah ≥ 1), `wallet_id`, `occurred_at` (date), `alloc_<groupId>` (rupiah ≥ 0, collected into an object).
- [ ] **Step 1: Validation test.** In `lib/validation.test.ts`, `salarySchema` must:
  - accept `{month:"2026-10", amount:"12.000.000", wallet_id, occurred_at:"2026-10-25"}` → `amount 12000000`;
  - reject `month:"2026-13"`.

  Run it and see it fail, then implement it and see it pass.
- [ ] **Step 2: Action.**
  - `recordSalary` parses the form, then checks the wallet with `walletError`.
  - It calls `supabase.rpc("record_salary", { p_month: month+"-01", p_salary, p_wallet, p_occurred_at: toOccurredAt(date), p_allocations })`.
  - Map the RPC error `alokasi tidak sama dengan gaji` to the copy "Total alokasi harus sama dengan gaji".
  - Then `revalidatePath("/", "layout")`.
- [ ] **Step 3: UI.**
  - `SalaryForm` in a `Dialog`, with these fields:
    - Bulan: a `Picker` of the last 3 and next 1 months, labeled "Oktober 2026".
    - Jumlah: `AmountInput`.
    - Dompet: `Picker`, default = the wallet of the latest period's income tx.
    - Tanggal: `DateField`, default today.
  - Below the fields, a live allocation list from `allocate()`. Each row's amount can be edited (`AmountInput`). A footer line "Total Rp X dari Rp Y" turns red when unequal, and Simpan is disabled while they differ.
  - In edit mode (the selected month already has a period), the dialog is prefilled.
  - `BudgetView` shows:
    - A header card: gaji, terpakai, sisa, "25 Okt – 24 Nov" (nominal range via `nominalEnd`), hari tersisa, aman per hari.
    - A `PosRow` list. Each row has an icon, name, `used / limit`, and a bar whose width animates (`scaleX`, `originX: 0`). The bar color by level is `positive` / `warning` / `negative`, and `saved` is `positive`.
    - On the savings row, the line "Kebutuhan setoran goal Rp X dari alokasi Rp Y". Leave it hidden until Task 8 provides goals.
    - An "Belum masuk pos" row linking to `/pengaturan`.
    - A period `Picker` for past periods (`?periode=YYYY-MM`).
    - Buttons "Catat gaji" (primary) and "Ubah alokasi" (tonal; opens `SalaryForm` in edit mode).
  - Empty state when there are no periods: "Catat gaji untuk mulai periode budget" with the button.
  - Leftover nudge: when viewing a closed period with leftover > 0, show "Sisa Rp X — pindahkan ke goal" linking to `/rencana?tab=goals`.
- [ ] **Step 4: Verify in the browser.**
  - Start a prod build on port 3005 and sign in as `smoke@tamoney.test`.
  - Catat gaji Oktober Rp 12.000.000 to "BCA Uji" on 25 Okt. Expected: 11 rows matching Task 2's numbers, and a Gaji income transaction on Ringkasan.
  - Catat gaji Oktober again with Rp 13.000.000. Expected: still one period, the income tx updated (not two).
  - Check at 375px and in dark mode.
- [ ] **Step 5:** `npm test && npm run lint && npm run build`. Expected: all pass.
- [ ] **Step 6: Commit**: `feat: payday budget page and salary recording`.

### Task 4: Pengaturan

**Files:**
- Create:
  - `app/(app)/pengaturan/page.tsx`
  - `components/settings/BudgetSettings.tsx`
  - `lib/actions/settings.ts`
- Modify:
  - `lib/validation.ts` (`budgetSettingsSchema`)
  - `components/shell/UserMenu.tsx` (add "Pengaturan" link with icon `settings`, above Pintasan)

**Interfaces:**
- Consumes: `DEFAULT_POS`, `allocate`, `getPlanningState`, `getCategories`.
- Produces:
  ```ts
  export const budgetSettingsSchema: z.ZodType<{ payday: number; groups: { id: string | null; name: string; icon: string; pct_bp: number; is_savings: boolean; category_ids: string[] }[] }>;
  export async function saveBudgetSettings(input: unknown): Promise<ActionState>;   // called with JSON, not FormData
  export async function resetBudgetDefaults(): Promise<ActionState>;               // restores DEFAULT_POS + DEFAULT_CATEGORY_MAP in TS
  ```
- [ ] **Step 1: Validation tests.** `budgetSettingsSchema`:
  - Rejects groups whose `pct_bp` sum is 9990 → message "Total persentase harus 100%".
  - Rejects `pct_bp` -1 and 10001.
  - Rejects zero or two `is_savings` groups.
  - Rejects a category id appearing in two groups.
  - Rejects `payday` 29.
  - Accepts the defaults.

  Fail, implement, then pass.
- [ ] **Step 2: Actions.**
  - `saveBudgetSettings`:
    - Upserts groups (new ones have `id: null`).
    - Deletes groups missing from the input, except the savings pos.
    - Sets `categories.budget_group_id` for each listed id, and sets it to null for every expense category not listed.
    - Updates `profiles.payday_day`.
  - `resetBudgetDefaults`:
    - Sets all names/pcts back to `DEFAULT_POS`. It matches by name and inserts missing pos; extra pos are deleted.
    - Re-maps categories with the §3 name table, using a `DEFAULT_CATEGORY_MAP` constant exported from `lib/budget.ts`.
  - Neither action touches existing `budget_allocations`; current periods keep their numbers (§4.4).
- [ ] **Step 3: UI** (`BudgetSettings`, client):
  - Payday `Picker` 1–28.
  - One row per pos:
    - `IconButton` icon picker: a `Popover` grid of ~24 Material icons already used by categories.
    - Name `Input`.
    - Percent `Input` with `inputMode="decimal"`, showing one decimal (bp/100) and parsing `,` or `.`.
    - `MultiSelect` of expense categories. Selecting a category already in another pos moves it.
  - Delete pos via `useConfirm` (destructive). Hidden on the savings pos.
  - "Tambah pos" button.
  - A sticky footer:
    - Total %, colored `negative` when ≠ 100,0.
    - Rupiah preview of `allocate(latestSalary || 12_000_000, groups)`.
    - "Kembalikan ke default" (ghost, with confirm).
    - Simpan (primary, disabled unless the total is 10000).
  - Also on the page: a card "Pintasan iPhone" linking to `/pintasan`.
- [ ] **Step 4: Verify in the browser.**
  - Change Makanan to 14% → Simpan disabled, total shows 99,0%.
  - Change Hiburan to 4,3% → Simpan, reload, values persist.
  - The current period's allocations are unchanged on `/budget`.
  - Kembalikan ke default → §4.3 values are back.
- [ ] **Step 5:** `npm test && npm run lint && npm run build`, then commit `feat: Pengaturan page for budget percentages and payday`.

### Task 5: `lib/bills.ts`

**Files:**
- Create: `lib/bills.ts`, `lib/bills.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function nextDue(b: Pick<Bill, "cadence" | "due_day" | "next_due">): string;
  export type DueState = { kind: "late" | "soon" | "later"; days: number }; // days = |next_due - today|
  export function dueStatus(b: Pick<Bill, "next_due" | "remind_days">, today: string): DueState; // late: next_due < today; soon: next_due - remind_days <= today; else later
  export function dueLabel(s: DueState): string; // "Terlambat 2 hari" | "Hari ini" | "Besok" | "Dalam 3 hari" | "12 Nov"-style is done by caller for later
  export function monthTotal(bills: Bill[], month: string): number; // sum of amounts whose occurrences fall in month (weekly counts each occurrence)
  ```
- [ ] **Step 1: Failing tests.**
  - `nextDue({monthly, 31, "2027-01-31"})` = `"2027-02-28"`.
  - `nextDue({monthly, 31, "2027-02-28"})` = `"2027-03-31"`.
  - `nextDue({monthly, 31, "2028-01-31"})` = `"2028-02-29"`.
  - `nextDue({yearly, 29, "2028-02-29"})` = `"2029-02-28"`.
  - `nextDue({weekly, null, "2026-10-29"})` = `"2026-11-05"`.
  - `dueStatus` late / soon / later, with `remind_days` 3 at day offsets −2, 0, 3, 4.
  - `dueLabel` copy for 0, 1, 3 and late 2.
  - `monthTotal`: a weekly 50_000 bill starting 2026-11-02 counts 5 times in November.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3: Implement.** Keep the same rule as `pay_bill` in Task 1. Add a comment on `nextDue` naming the SQL twin.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit**: `feat: recurring bill due-date rules`.

### Task 6: Rencana → Tagihan

**Files:**
- Create:
  - `app/(app)/rencana/page.tsx`, `app/(app)/rencana/loading.tsx`
  - `components/plan/PlanTabs.tsx`
  - `components/bills/BillList.tsx`, `components/bills/BillForm.tsx`, `components/bills/PayBill.tsx`
  - `lib/actions/bills.ts`
- Modify:
  - `lib/validation.ts` (`billSchema`, `payBillSchema`)
  - `lib/planning.ts` (load bills)
  - `components/shell/Nav.tsx` (add `{ href: "/rencana", label: "Rencana", icon: "flag" }` after Budget)

**Interfaces:**
- Consumes: Task 5, `getPlanningState`, `walletError`, `getActiveWalletIds`.
- Produces:
  ```ts
  export async function saveBill(_: ActionState, fd: FormData): Promise<ActionState>;
  export async function payBill(_: ActionState, fd: FormData): Promise<ActionState>;   // fields: bill_id, due, amount, wallet_id, occurred_at
  export async function skipBill(id: string, due: string): Promise<ActionState>;
  export async function setBillArchived(id: string, archived: boolean): Promise<ActionState>;
  export function PayBillButton(props: { bill: Bill; wallets: Wallet[]; size?: "sm" | "md" }): JSX.Element; // components/bills/PayBill.tsx — reused by notifications & Ringkasan
  ```
  `billSchema` fields:
  - `name` (1..50)
  - `icon`
  - `amount` (≥1)
  - `category_id`
  - `wallet_id`
  - `cadence`
  - `next_due` (date)
  - `remind_days` (0..14, default 3)

  `due_day` is derived from `next_due` in the action, for monthly/yearly.
- [ ] **Step 1: Validation tests.**
  - `billSchema` accepts a Netflix monthly bill.
  - It rejects `remind_days: 15`.
  - `payBillSchema` rejects amount 0.

  Fail, implement, then pass.
- [ ] **Step 2: Actions.**
  - `payBill` checks the wallet with `walletError` (archived wallet → the existing message), then calls `rpc("pay_bill", …)`. It maps `tagihan sudah dibayar` → "Tagihan ini sudah dibayar".
  - `saveBill` verifies the category's kind is expense.
- [ ] **Step 3: UI.**
  - `/rencana` reads `?tab=goals|tagihan` (default `goals`) with `useUrlState` and switches with `Segmented`. In this task the Goals tab is an `EmptyState` placeholder until Task 8.
  - `BillList`:
    - A top card "Tagihan bulan ini Rp X".
    - Sections "Terlambat", "7 hari ke depan", "Nanti".
    - Each row has: icon, name, wallet, amount, due label (late in `negative`), `PayBillButton`, and an overflow `Popover` with Edit / Lewati bulan ini (confirm) / Arsipkan (confirm).
    - An archived section is collapsed at the bottom with Pulihkan.
  - `BillForm` is a `Dialog` with:
    - The fields above.
    - `Segmented` Mingguan/Bulanan/Tahunan.
    - `DateField` with `max={null}`.
    - Category `Picker` defaulting to Langganan.
    - The icon defaults to the category icon until changed.
  - `PayBill` dialog: amount prefilled with the estimate, wallet, date; submits `payBill`.
- [ ] **Step 4: Verify in the browser.**
  - Add "Wifi" Rp 350.000 monthly, due tomorrow, remind 3 → it appears under "7 hari ke depan" as "Besok".
  - Bayar with amount 345.000 → an expense of 345.000 appears in Analitik on today; the bill's due date moves one month.
  - Double-click Simpan in the Pay dialog → only one expense.
  - Check at 375px.
- [ ] **Step 5:** `npm test && npm run lint && npm run build`, then commit `feat: recurring bills with pay and skip`.

### Task 7: `lib/goals.ts`

**Files:**
- Create: `lib/goals.ts`, `lib/goals.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type GoalTx = { goal_id: string | null; kind: TxKind; amount: number; wallet_id: string; to_wallet_id: string | null; occurred_at: string };
  export function saved(goal: Goal, txs: GoalTx[]): number;                 // initial_amount + Σ into goal.wallet_id − Σ out of it, for txs with goal_id = goal.id
  export function paydaysUntil(today: string, due: string, payday: number): number; // count of payday dates in (today, due], min 1
  export function monthlyNeed(goal: Goal, savedNow: number, today: string, payday: number): number; // due: ceil((target-saved)/paydaysUntil, to 1000); else monthly_amount ?? 0; never < 0
  export type GoalStatus = "tercapai" | "tertinggal" | "sesuai";
  export function goalStatus(a: { target: number; saved: number; need: number; depositedThisPeriod: number; due: string | null; today: string; periodEnd: string }): GoalStatus;
  export type GoalWithProgress = Goal & { saved: number; need: number; depositedThisPeriod: number; status: GoalStatus };
  ```
- [ ] **Step 1: Failing tests.**
  - `saved`: initial 1_000_000 plus a 500_000 deposit, minus a 200_000 withdrawal, plus an unrelated transfer → 1_300_000.
  - `paydaysUntil("2026-10-29", "2027-04-30", 25)` = 6 (Nov–Apr).
  - `paydaysUntil` with the due date this week = 1.
  - `monthlyNeed`: target 24_000_000, saved 0, due 6 paydays away → 4_000_000; saved > target → 0; no due date with `monthly_amount` 1_500_000 → 1_500_000.
  - `goalStatus`:
    - saved ≥ target → `tercapai`.
    - Due date passed → `tertinggal`.
    - 3 days left in the period with a deposit below need → `tertinggal`.
    - 20 days left → `sesuai`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit**: `feat: goal progress and monthly need rules`.

### Task 8: Rencana → Goals

**Files:**
- Create:
  - `components/goals/GoalList.tsx`, `components/goals/GoalCard.tsx`, `components/goals/GoalForm.tsx`, `components/goals/GoalMoney.tsx` (Setor/Tarik)
  - `lib/actions/goals.ts`
- Modify:
  - `lib/validation.ts` (`goalSchema`)
  - `lib/actions/transactions.ts` (`saveTransfer` accepts optional `goal_id`)
  - `lib/planning.ts` (goals with progress; savings-pos goal need)
  - `components/budget/BudgetView.tsx` (show the goal-need line)
  - `components/plan/PlanTabs.tsx`

**Interfaces:**
- Consumes: Task 7, `TransferForm` patterns, `saveTransfer`.
- Produces:
  ```ts
  export async function saveGoal(_: ActionState, fd: FormData): Promise<ActionState>;
  export async function setGoalArchived(id: string, archived: boolean): Promise<ActionState>;
  export function GoalMoneyButton(props: { goal: GoalWithProgress; wallets: Wallet[]; mode: "setor" | "tarik"; size?: "sm" | "md" }): JSX.Element; // reused by notifications
  ```
  - `saveTransfer`: when `goal_id` is present, verify the goal belongs to the user and isn't archived, and that one side of the transfer is the goal's `wallet_id`. Otherwise return "Goal tidak valid".
  - `getPlanningState.goals`: fetch goal transactions with `select … where goal_id is not null`.
  - `achieved_at`: set it in `saveTransfer` when a deposit makes `saved ≥ target` (an update on the goal).
- [ ] **Step 1: Validation tests.** `goalSchema`:
  - Requires `monthly_amount` when `due_date` is empty → "Isi due date atau setoran bulanan".
  - Rejects `target` 0.
  - Accepts `initial_amount > target` (the goal is simply reached).
  - Rejects `wallet_id === source_wallet_id` → "Dompet sumber dan tujuan harus berbeda".

  Fail, implement, then pass.
- [ ] **Step 2: Action test.** Extend the transfer guard so that `goal_id` with a transfer touching neither side of the goal's wallet → "Goal tidak valid". Put the pure check in `lib/guards.ts`, `goalTransferError(goalWalletId, from, to): string | null`, and test it in `lib/guards.test.ts`. Also cover an archived source wallet → the existing `walletError` message.
- [ ] **Step 3: UI.**
  - `GoalCard`:
    - An SVG progress ring (stroke-dashoffset animated with motion).
    - Name, `saved / target`, a due chip "Jun 2027 · 8 bln lagi", the wallet name.
    - "Bulan ini Rp X dari Rp Y".
    - A status badge: Sesuai rencana = `positive`, Tertinggal = `warning`, Tercapai = `primary`.
    - Buttons Setor (tonal sm) and Tarik (ghost sm).
    - Overflow: Edit / Arsipkan (confirm).
  - `GoalMoney`:
    - Setor: a transfer from `source_wallet_id` (Picker) to the goal wallet (fixed, shown as text), amount prefilled with `need − depositedThisPeriod` when > 0.
    - Tarik: from the goal wallet to a Picker wallet, max `saved`.
  - `GoalForm`: name, icon, target, sudah terkumpul, due date (`DateField max={null}`, clearable), setoran bulanan (shows the "Saran: Rp X/bulan" hint when a due date is set), dompet tujuan, dompet sumber.
  - Empty state: "Buat goal pertama — mis. Dana Darurat 3× pengeluaran".
  - Budget savings row: "Kebutuhan setoran goal Rp Σneed dari alokasi Rp Y".
- [ ] **Step 4: Verify in the browser.**
  - Create "Dana Darurat": target 24.000.000, terkumpul 0, due 6 months out, wallet "Mandiri Uji", source "BCA Uji" → suggested need 4.000.000.
  - Setor 1.000.000 → the ring shows 1jt; BCA Uji −1jt and Mandiri Uji +1jt on Dompet; the Budget Tabungan pos used = 1jt.
  - Tarik 200.000 → saved 800.000.
- [ ] **Step 5:** `npm test && npm run lint && npm run build`, then commit `feat: savings goals linked to wallets`.

### Task 9: Notifications + Ringkasan

**Files:**
- Create:
  - `lib/notifications.ts`, `lib/notifications.test.ts`
  - `components/shell/Notifications.tsx`
  - `components/dashboard/PlanCards.tsx`
- Modify:
  - `app/(app)/layout.tsx` (bell next to QuickAdd)
  - `app/(app)/page.tsx` (cards under the balance card)

**Interfaces:**
- Consumes: `PlanningState`, `dueStatus`, `dueLabel`, `PosUsage`, `GoalWithProgress`, `PayBillButton`, `GoalMoneyButton`.
- Produces:
  ```ts
  export type Notice = { id: string; kind: "bill-late" | "bill-soon" | "salary" | "budget-over" | "budget-warn" | "goal-deposit" | "goal-behind" | "goal-done"; title: string; body: string; href: string; billId?: string; goalId?: string };
  export function buildNotifications(s: PlanningState, today: string): Notice[];
  ```
  - Order: bill-late, salary, budget-over, bill-soon, goal-behind, budget-warn, goal-deposit, goal-done. Within a kind, soonest first.
  - Example copy:
    - "Wifi terlambat 2 hari" / "Rp 350.000 · BCA Uji"
    - "Gaji Oktober belum dicatat"
    - "Makanan 92% terpakai" / "Sisa Rp 150.000"
    - "Setor Dana Darurat" / "Rp 3.000.000 lagi bulan ini"
  - salary: `today` day ≥ payday and no period for `today`'s month.
  - goal-done: `achieved_at` within 7 days.
  - goal-deposit: status `sesuai` but deposited < need. A goal that is `tertinggal` shows only goal-behind.
- [ ] **Step 1: Failing tests.**
  - A state with: one late bill, one bill due in 2 days with remind 3, one bill due in 10 days, no period on 2026-10-26 with payday 25, a Makanan pos at 105%, a goal behind.
    - Expected kinds in order: `["bill-late","salary","budget-over","bill-soon","goal-behind"]`.
    - The 10-day bill is absent.
  - An empty state → `[]`.
  - Copy for one late bill = "Wifi terlambat 2 hari".
- [ ] **Step 2:** Run → FAIL, implement, then run → PASS.
- [ ] **Step 3: UI.**
  - `Notifications` (client):
    - An `IconButton` bell (`notifications`) with a count badge (max "9+").
    - On ≥ md, a `Popover` 360 wide; on mobile, the draggable sheet pattern from QuickAdd, portaled to body.
    - Each item has a tinted icon by kind, the title, the body, and an action:
      - `PayBillButton` sm for bills.
      - `GoalMoneyButton` setor for goal-deposit.
      - Otherwise a Link chevron to `href`.
    - Empty: "Semua beres — tidak ada yang perlu ditindak".
  - The layout loads `getPlanningState` and wallets (already cached) and passes the notices.
  - `PlanCards` on Ringkasan:
    - Budget periode ini: sisa, aman/hari, a total bar → `/budget`.
    - Tagihan berikutnya: the top 3 with Bayar → `/rencana?tab=tagihan`.
    - Goals: 2 rings → `/rencana`.
    - Each card has an `EmptyState`-style CTA when there is no data.
- [ ] **Step 4: Verify in the browser.**
  - With the Task 6/8 data: the bell badge counts the due bill and the goal deposit; Bayar from the panel removes the bill item without a full reload (revalidate).
  - Ringkasan shows the three cards.
  - Check at 375px: the sheet opens above the tab bar. Check dark mode.
- [ ] **Step 5:** `npm test && npm run lint && npm run build`, then commit `feat: notification panel and planning cards on Ringkasan`.

### Task 10: Docs, and a final check

**Files:**
- Modify:
  - `docs/knowledge/database.md` (new tables, RPCs)
  - `docs/knowledge/screens.md` (Budget, Rencana, Pengaturan, bell)
  - `docs/knowledge/prd.md` (mark the new features ✅)
  - `docs/knowledge/design-system.md` (progress ring, pos bar levels)
  - `docs/knowledge/README.md`
- Create:
  - `docs/knowledge/memory/budget-payday-pos.md`: the payday-period rule, savings gets the rounding remainder, and why.
  - `docs/knowledge/memory/goals-via-transfers.md`: goal progress = tagged transfers, not wallet balance, and why.
  - `docs/knowledge/memory/notifications-derived.md`: derived and stateless, no push yet, and why.

  Frontmatter for each: `title`, `tags`, `type`, `updated: 2026-10-29`.

- [ ] **Step 1:** Write the docs and link the memory notes from `README.md`.
- [ ] **Step 2:** Run `npm test && npm run lint && npm run build` and Supabase advisors. Expected: all green, no new advisor warnings.
- [ ] **Step 3: Delete the smoke-test data** created in Tasks 3–9 (periods, bills, goals, and the test transactions for `smoke@tamoney.test` only). Leave production user data untouched.
- [ ] **Step 4: Commit**: `docs: budget, bills, goals and notifications in the vault`.
