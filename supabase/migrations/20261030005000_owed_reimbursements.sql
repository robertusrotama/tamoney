-- "Tagih ke teman": an expense can carry an amount others owe you. When they pay it back, settle_owed records a
-- linked income ("Pengembalian") in the chosen wallet; reports count it as less expense in the same category.
alter table public.transactions
  add column owed_amount bigint check (owed_amount > 0),
  add column owed_note text check (char_length(owed_note) <= 100),
  add column owed_settled_at timestamptz,
  add column reimburses_id uuid,
  add constraint transactions_owed_expense check (owed_amount is null or (kind = 'expense' and owed_amount <= amount)),
  add constraint transactions_reimburses_income check (reimburses_id is null or kind = 'income'),
  add constraint transactions_reimburses_owner_fkey
    foreign key (reimburses_id, user_id) references public.transactions (id, user_id) on delete cascade;
create index transactions_reimburses_user_idx on public.transactions (reimburses_id, user_id);

-- Marks the expense's owed amount as paid back into p_wallet on p_occurred_at, atomically.
create function public.settle_owed(p_tx uuid, p_wallet uuid, p_occurred_at timestamptz) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  e public.transactions;
begin
  select * into e from public.transactions where id = p_tx and kind = 'expense' for update;
  if e.id is null or e.owed_amount is null then raise exception 'tagihan teman tidak ditemukan'; end if;
  if e.owed_settled_at is not null then raise exception 'sudah dibayar'; end if;
  insert into public.transactions (kind, amount, wallet_id, category_id, note, occurred_at, reimburses_id)
  values ('income', e.owed_amount, p_wallet, e.category_id,
          'Pengembalian' || coalesce(': ' || e.owed_note, ''), p_occurred_at, e.id);
  update public.transactions set owed_settled_at = now() where id = e.id;
end;
$$;
revoke execute on function public.settle_owed(uuid, uuid, timestamptz) from public, anon;
grant execute on function public.settle_owed(uuid, uuid, timestamptz) to authenticated;
