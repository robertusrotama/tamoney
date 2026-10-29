-- Cover the owner-scoped FKs added in budget_bills_goals (advisor 0001), same pattern as fk_indexes.
drop index public.categories_budget_group_idx, public.budget_periods_income_tx_idx, public.budget_allocations_group_idx,
  public.budget_allocations_user_idx, public.goals_wallet_idx, public.goals_source_wallet_idx,
  public.bills_category_idx, public.bills_wallet_idx, public.transactions_goal_idx, public.transactions_bill_idx;
create index categories_budget_group_user_idx on public.categories (budget_group_id, user_id);
create index budget_periods_income_tx_user_idx on public.budget_periods (income_tx_id, user_id);
create index budget_allocations_period_user_idx on public.budget_allocations (period_id, user_id);
create index budget_allocations_group_user_idx on public.budget_allocations (group_id, user_id);
create index goals_wallet_user_idx on public.goals (wallet_id, user_id);
create index goals_source_wallet_user_idx on public.goals (source_wallet_id, user_id);
create index bills_category_user_idx on public.bills (category_id, user_id);
create index bills_wallet_user_idx on public.bills (wallet_id, user_id);
create index transactions_goal_user_idx on public.transactions (goal_id, user_id);
create index transactions_bill_user_idx on public.transactions (bill_id, user_id);
