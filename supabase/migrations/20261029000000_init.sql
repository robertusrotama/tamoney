-- TaMoney schema. Docs: docs/knowledge/database.md

create type public.wallet_type as enum ('cash', 'bank', 'ewallet', 'other');
create type public.category_kind as enum ('income', 'expense');
create type public.tx_kind as enum ('income', 'expense', 'transfer');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  currency text not null default 'IDR',
  created_at timestamptz not null default now()
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 50),
  type public.wallet_type not null default 'cash',
  initial_balance bigint not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind public.category_kind not null,
  name text not null check (char_length(name) between 1 and 50),
  icon text not null default 'more_horiz',
  created_at timestamptz not null default now(),
  unique (user_id, kind, name)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind public.tx_kind not null,
  amount bigint not null check (amount > 0 and amount <= 1000000000000),
  wallet_id uuid not null references public.wallets on delete restrict,
  to_wallet_id uuid references public.wallets on delete restrict,
  category_id uuid references public.categories on delete restrict,
  note text check (char_length(note) <= 200),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (
    (kind = 'transfer' and to_wallet_id is not null and to_wallet_id <> wallet_id and category_id is null)
    or (kind <> 'transfer' and category_id is not null and to_wallet_id is null)
  )
);

create index transactions_user_occurred_idx on public.transactions (user_id, occurred_at desc);

-- RLS: every row belongs to its user
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy "own profile" on public.profiles for all
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "own wallets" on public.wallets for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own categories" on public.categories for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own transactions" on public.transactions for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Balances are derived, never stored (docs/knowledge/memory/balance-from-view.md)
create view public.wallet_balances with (security_invoker = true) as
select
  w.id as wallet_id,
  w.initial_balance + coalesce(sum(
    case
      when t.kind = 'income' and t.wallet_id = w.id then t.amount
      when t.kind = 'expense' and t.wallet_id = w.id then -t.amount
      when t.kind = 'transfer' and t.wallet_id = w.id then -t.amount
      when t.kind = 'transfer' and t.to_wallet_id = w.id then t.amount
      else 0
    end), 0)::bigint as balance
from public.wallets w
left join public.transactions t on t.wallet_id = w.id or t.to_wallet_id = w.id
group by w.id;

-- New user: profile + default categories
create function public.handle_new_user() returns trigger
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
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
