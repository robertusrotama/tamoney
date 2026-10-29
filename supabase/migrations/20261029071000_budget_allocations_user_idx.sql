-- FK budget_allocations.user_id → auth.users (advisor 0001); also the RLS filter column.
create index budget_allocations_user_idx on public.budget_allocations (user_id);
