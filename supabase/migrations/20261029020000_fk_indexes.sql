-- Cover the owner-scoped FKs (Supabase advisor 0001); these also serve wallet_balances lookups.
drop index public.transactions_wallet_idx;
drop index public.transactions_to_wallet_idx;
drop index public.transactions_category_idx;
create index transactions_wallet_user_idx on public.transactions (wallet_id, user_id);
create index transactions_to_wallet_user_idx on public.transactions (to_wallet_id, user_id);
create index transactions_category_user_idx on public.transactions (category_id, user_id);
create index wallets_user_idx on public.wallets (user_id);
