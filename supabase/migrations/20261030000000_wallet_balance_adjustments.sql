-- Editing a wallet sets its current balance; each change is logged. The adjustment moves initial_balance by the
-- difference, so wallet_balances stays the single source of truth and no income/expense is invented.
create table public.wallet_balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  wallet_id uuid not null,
  previous bigint not null,
  balance bigint not null,
  created_at timestamptz not null default now(),
  foreign key (wallet_id, user_id) references public.wallets (id, user_id) on delete cascade
);
create index wallet_balance_adjustments_wallet_user_idx on public.wallet_balance_adjustments (wallet_id, user_id);
create index wallet_balance_adjustments_user_idx on public.wallet_balance_adjustments (user_id);

alter table public.wallet_balance_adjustments enable row level security;
create policy "own balance adjustments" on public.wallet_balance_adjustments for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.wallet_balance_adjustments from anon;
grant select, insert on public.wallet_balance_adjustments to authenticated;

create function public.set_wallet_balance(p_wallet uuid, p_balance bigint) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_current bigint;
begin
  perform 1 from public.wallets where id = p_wallet for update;
  if not found then raise exception 'dompet tidak ditemukan'; end if;
  select balance into v_current from public.wallet_balances where wallet_id = p_wallet;
  if v_current = p_balance then return; end if;
  update public.wallets set initial_balance = initial_balance + (p_balance - v_current) where id = p_wallet;
  insert into public.wallet_balance_adjustments (wallet_id, previous, balance) values (p_wallet, v_current, p_balance);
end;
$$;
revoke execute on function public.set_wallet_balance(uuid, bigint) from public, anon;
grant execute on function public.set_wallet_balance(uuid, bigint) to authenticated;
