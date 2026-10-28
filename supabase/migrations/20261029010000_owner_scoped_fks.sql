-- FK checks ignore RLS: without these, a user could point a transaction at someone else's
-- wallet or category (and, via on delete restrict, block that user's account deletion).
-- Composite keys make every reference stay inside the row owner's own data.

alter table public.wallets add constraint wallets_id_user_key unique (id, user_id);
alter table public.categories add constraint categories_id_user_key unique (id, user_id);

alter table public.transactions
  drop constraint transactions_wallet_id_fkey,
  drop constraint transactions_to_wallet_id_fkey,
  drop constraint transactions_category_id_fkey,
  add constraint transactions_wallet_owner_fkey
    foreign key (wallet_id, user_id) references public.wallets (id, user_id) on delete restrict,
  add constraint transactions_to_wallet_owner_fkey
    foreign key (to_wallet_id, user_id) references public.wallets (id, user_id) on delete restrict,
  add constraint transactions_category_owner_fkey
    foreign key (category_id, user_id) references public.categories (id, user_id) on delete restrict;

-- wallet_balances joins on either side of a transfer
create index transactions_wallet_idx on public.transactions (wallet_id);
create index transactions_to_wallet_idx on public.transactions (to_wallet_id);
create index transactions_category_idx on public.transactions (category_id);
