-- Re-adds the income → budget period FK. It was dropped right after 20261030002000 because the live app's
-- period→salary embed became ambiguous; apply only after the code with the explicit embed hint
-- (transactions!budget_periods_income_tx_id_user_id_fkey) is deployed.
alter table public.transactions
  add constraint transactions_budget_period_owner_fkey
    foreign key (budget_period_id, user_id) references public.budget_periods (id, user_id) on delete set null (budget_period_id);
