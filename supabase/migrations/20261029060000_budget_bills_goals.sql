-- Payday budget, recurring bills, savings goals. Spec: docs/superpowers/specs/2026-10-29-budget-tagihan-goals-design.md

alter table public.profiles add column payday_day smallint not null default 25 check (payday_day between 1 and 28);

-- Budget pos: one pos holds 1+ expense categories. pct_bp = basis points; the 10000 total is kept by the app.
create table public.budget_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  icon text not null default 'more_horiz',
  pct_bp int not null check (pct_bp between 0 and 10000),
  is_savings boolean not null default false,
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name),
  unique (id, user_id)
);
create unique index budget_groups_one_savings on public.budget_groups (user_id) where is_savings;

alter table public.categories
  add column budget_group_id uuid,
  add constraint categories_budget_group_owner_fkey
    foreign key (budget_group_id, user_id) references public.budget_groups (id, user_id) on delete set null (budget_group_id);
create index categories_budget_group_idx on public.categories (budget_group_id);

alter table public.transactions add constraint transactions_id_user_key unique (id, user_id);

-- One period per salary; it runs until the next salary's start_date.
create table public.budget_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  month date not null check (extract(day from month) = 1),
  start_date date not null,
  salary bigint not null check (salary > 0 and salary <= 1000000000000),
  income_tx_id uuid,
  created_at timestamptz not null default now(),
  unique (user_id, month),
  unique (id, user_id),
  foreign key (income_tx_id, user_id) references public.transactions (id, user_id) on delete set null (income_tx_id)
);
create index budget_periods_income_tx_idx on public.budget_periods (income_tx_id);

-- Copied per period, so changing percentages later never rewrites past months.
create table public.budget_allocations (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  period_id uuid not null,
  group_id uuid not null,
  amount bigint not null check (amount >= 0),
  primary key (period_id, group_id),
  foreign key (period_id, user_id) references public.budget_periods (id, user_id) on delete cascade,
  foreign key (group_id, user_id) references public.budget_groups (id, user_id) on delete cascade
);
create index budget_allocations_group_idx on public.budget_allocations (group_id);
create index budget_allocations_user_idx on public.budget_allocations (user_id);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 50),
  icon text not null default 'savings',
  target bigint not null check (target > 0 and target <= 1000000000000),
  initial_amount bigint not null default 0 check (initial_amount >= 0),
  due_date date,
  monthly_amount bigint check (monthly_amount > 0),
  wallet_id uuid not null,
  source_wallet_id uuid,
  achieved_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (wallet_id, user_id) references public.wallets (id, user_id) on delete restrict,
  foreign key (source_wallet_id, user_id) references public.wallets (id, user_id) on delete restrict
);
create index goals_user_idx on public.goals (user_id);
create index goals_wallet_idx on public.goals (wallet_id);
create index goals_source_wallet_idx on public.goals (source_wallet_id);

create type public.bill_cadence as enum ('weekly', 'monthly', 'yearly');

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 50),
  icon text not null default 'receipt_long',
  amount bigint not null check (amount > 0 and amount <= 1000000000000),
  category_id uuid not null,
  wallet_id uuid not null,
  cadence public.bill_cadence not null default 'monthly',
  due_day smallint check (due_day between 1 and 31), -- the original day, so 31 comes back after February
  next_due date not null,
  remind_days smallint not null default 3 check (remind_days between 0 and 14),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete restrict,
  foreign key (wallet_id, user_id) references public.wallets (id, user_id) on delete restrict
);
create index bills_user_idx on public.bills (user_id);
create index bills_category_idx on public.bills (category_id);
create index bills_wallet_idx on public.bills (wallet_id);

alter table public.transactions
  add column goal_id uuid,
  add column bill_id uuid,
  add constraint transactions_goal_owner_fkey foreign key (goal_id, user_id) references public.goals (id, user_id) on delete restrict,
  add constraint transactions_bill_owner_fkey foreign key (bill_id, user_id) references public.bills (id, user_id) on delete restrict,
  add constraint transactions_goal_is_transfer check (goal_id is null or kind = 'transfer'),
  add constraint transactions_bill_is_expense check (bill_id is null or kind = 'expense');
create index transactions_goal_idx on public.transactions (goal_id);
create index transactions_bill_idx on public.transactions (bill_id);

alter table public.budget_groups enable row level security;
alter table public.budget_periods enable row level security;
alter table public.budget_allocations enable row level security;
alter table public.goals enable row level security;
alter table public.bills enable row level security;

create policy "own budget groups" on public.budget_groups for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own budget periods" on public.budget_periods for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own budget allocations" on public.budget_allocations for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own goals" on public.goals for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own bills" on public.bills for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.budget_groups, public.budget_periods, public.budget_allocations, public.goals, public.bills from anon;
grant select, insert, update, delete on public.budget_groups, public.budget_periods, public.budget_allocations, public.goals, public.bills to authenticated;

-- Twin of nextDue() in lib/bills.ts — keep the two rules identical.
create function public.bill_next_due(p_cadence public.bill_cadence, p_due_day smallint, p_from date) returns date
language sql immutable set search_path = '' as $$
  select case p_cadence
    when 'weekly' then p_from + 7
    else (
      select make_date(extract(year from n)::int, extract(month from n)::int,
        least(coalesce(p_due_day, extract(day from p_from)::int), extract(day from n + interval '1 month - 1 day')::int))
      from (select (date_trunc('month', p_from) + case p_cadence when 'yearly' then interval '12 month' else interval '1 month' end)::date as n) m
    )
  end
$$;

-- Pays one bill: records the expense and advances next_due atomically. p_due = the due date the user saw,
-- so a double tap fails instead of paying twice.
create function public.pay_bill(p_bill uuid, p_due date, p_amount bigint, p_wallet uuid, p_occurred_at timestamptz) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  b public.bills;
begin
  select * into b from public.bills where id = p_bill for update;
  if b.id is null then raise exception 'tagihan tidak ditemukan'; end if;
  if b.next_due <> p_due then raise exception 'tagihan sudah dibayar'; end if;
  insert into public.transactions (kind, amount, wallet_id, category_id, note, occurred_at, bill_id)
  values ('expense', p_amount, p_wallet, b.category_id, b.name, p_occurred_at, b.id);
  update public.bills set next_due = public.bill_next_due(b.cadence, b.due_day, b.next_due) where id = b.id;
end;
$$;

create function public.skip_bill(p_bill uuid, p_due date) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  b public.bills;
begin
  select * into b from public.bills where id = p_bill for update;
  if b.id is null then raise exception 'tagihan tidak ditemukan'; end if;
  if b.next_due <> p_due then raise exception 'tagihan sudah dibayar'; end if;
  update public.bills set next_due = public.bill_next_due(b.cadence, b.due_day, b.next_due) where id = b.id;
end;
$$;

-- Records (or re-records) one month's salary: income transaction + period + allocations, atomically.
create function public.record_salary(p_month date, p_salary bigint, p_wallet uuid, p_occurred_at timestamptz, p_allocations jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_cat uuid;
  v_existing public.budget_periods;
  v_tx uuid;
  v_period uuid;
  v_months text[] := array['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if (select coalesce(sum(value::bigint), 0) from jsonb_each_text(p_allocations)) <> p_salary then
    raise exception 'alokasi tidak sama dengan gaji';
  end if;

  select id into v_cat from public.categories where user_id = v_uid and kind = 'income' and name = 'Gaji';
  if v_cat is null then
    insert into public.categories (kind, name, icon) values ('income', 'Gaji', 'payments') returning id into v_cat;
  end if;

  select * into v_existing from public.budget_periods where user_id = v_uid and month = p_month for update;
  if v_existing.income_tx_id is not null then
    update public.transactions set amount = p_salary, wallet_id = p_wallet, occurred_at = p_occurred_at
     where id = v_existing.income_tx_id returning id into v_tx;
  end if;
  if v_tx is null then
    insert into public.transactions (kind, amount, wallet_id, category_id, note, occurred_at)
    values ('income', p_salary, p_wallet, v_cat,
            'Gaji ' || v_months[extract(month from p_month)::int] || ' ' || extract(year from p_month)::int, p_occurred_at)
    returning id into v_tx;
  end if;

  insert into public.budget_periods (month, start_date, salary, income_tx_id)
  values (p_month, (p_occurred_at at time zone 'Asia/Jakarta')::date, p_salary, v_tx)
  on conflict (user_id, month) do update
    set start_date = excluded.start_date, salary = excluded.salary, income_tx_id = excluded.income_tx_id
  returning id into v_period;

  delete from public.budget_allocations where period_id = v_period;
  insert into public.budget_allocations (period_id, group_id, amount)
  select v_period, key::uuid, value::bigint from jsonb_each_text(p_allocations);
  return v_period;
end;
$$;

revoke execute on function public.bill_next_due(public.bill_cadence, smallint, date) from public, anon;
revoke execute on function public.pay_bill(uuid, date, bigint, uuid, timestamptz) from public, anon;
revoke execute on function public.skip_bill(uuid, date) from public, anon;
revoke execute on function public.record_salary(date, bigint, uuid, timestamptz, jsonb) from public, anon;
grant execute on function public.bill_next_due(public.bill_cadence, smallint, date) to authenticated;
grant execute on function public.pay_bill(uuid, date, bigint, uuid, timestamptz) to authenticated;
grant execute on function public.skip_bill(uuid, date) to authenticated;
grant execute on function public.record_salary(date, bigint, uuid, timestamptz, jsonb) to authenticated;

-- Default pos + missing categories (spec §4.3). Mirrored by DEFAULT_POS / DEFAULT_CATEGORY_MAP in lib/budget.ts.
create function public.seed_budget(uid uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.categories (user_id, kind, name, icon) values
    (uid, 'expense', 'Groceries', 'shopping_cart'),
    (uid, 'expense', 'Kost & Rumah', 'home'),
    (uid, 'expense', 'Langganan', 'subscriptions')
  on conflict do nothing;

  insert into public.budget_groups (user_id, name, icon, pct_bp, is_savings, sort) values
    (uid, 'Tabungan & Investasi', 'savings', 3333, true, 0),
    (uid, 'Rumah & Kost', 'home', 2000, false, 1),
    (uid, 'Makanan', 'restaurant', 1500, false, 2),
    (uid, 'Groceries', 'shopping_cart', 750, false, 3),
    (uid, 'Transportasi', 'directions_car', 500, false, 4),
    (uid, 'Belanja', 'shopping_bag', 500, false, 5),
    (uid, 'Kesehatan', 'medical_services', 417, false, 6),
    (uid, 'Hiburan', 'movie', 333, false, 7),
    (uid, 'Langganan', 'subscriptions', 250, false, 8),
    (uid, 'Gereja & Sosial', 'volunteer_activism', 250, false, 9),
    (uid, 'Lain-lain', 'more_horiz', 167, false, 10)
  on conflict do nothing;

  update public.categories c set budget_group_id = g.id
    from (values
      ('Investasi', 'Tabungan & Investasi'),
      ('Kost & Rumah', 'Rumah & Kost'), ('Tagihan & Utilitas', 'Rumah & Kost'),
      ('Makan & Minum', 'Makanan'), ('Groceries', 'Groceries'), ('Transportasi', 'Transportasi'),
      ('Belanja', 'Belanja'), ('Kesehatan', 'Kesehatan'), ('Hiburan', 'Hiburan'), ('Langganan', 'Langganan'),
      ('Gereja', 'Gereja & Sosial'), ('Lainnya', 'Lain-lain'), ('Tarik Tunai', 'Lain-lain')
    ) m (category, pos)
    join public.budget_groups g on g.user_id = uid and g.name = m.pos
   where c.user_id = uid and c.kind = 'expense' and c.name = m.category and c.budget_group_id is null;
end;
$$;
revoke execute on function public.seed_budget(uuid) from public, anon, authenticated;

select public.seed_budget(id) from public.profiles;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');

  insert into public.categories (user_id, kind, name, icon) values
    (new.id, 'expense', 'Makan & Minum', 'restaurant'),
    (new.id, 'expense', 'Transportasi', 'directions_car'),
    (new.id, 'expense', 'Belanja', 'shopping_bag'),
    (new.id, 'expense', 'Tagihan & Utilitas', 'bolt'),
    (new.id, 'expense', 'Hiburan', 'movie'),
    (new.id, 'expense', 'Kesehatan', 'medical_services'),
    (new.id, 'expense', 'Lainnya', 'more_horiz'),
    (new.id, 'income', 'Gaji', 'payments'),
    (new.id, 'income', 'Bonus', 'redeem'),
    (new.id, 'income', 'Hasil Investasi', 'trending_up'),
    (new.id, 'income', 'Lainnya', 'more_horiz');

  perform public.seed_budget(new.id);
  return new;
end;
$$;
