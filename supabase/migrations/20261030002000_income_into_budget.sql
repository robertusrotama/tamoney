-- Income marked "masukkan ke budget bulanan" points at the salary period it tops up. The extra budget is derived
-- from these rows (lib/budget.ts withTopup), so editing or deleting the income updates the budget by itself.
alter table public.transactions
  add column budget_period_id uuid,
  add constraint transactions_budget_period_owner_fkey
    foreign key (budget_period_id, user_id) references public.budget_periods (id, user_id) on delete set null (budget_period_id),
  add constraint transactions_budget_period_income check (budget_period_id is null or kind = 'income');
create index transactions_budget_period_user_idx on public.transactions (budget_period_id, user_id);

-- (Its FK was dropped again in the live DB until the explicit-embed code shipped; see 20261030003000.)
alter table public.transactions drop constraint transactions_budget_period_owner_fkey;
