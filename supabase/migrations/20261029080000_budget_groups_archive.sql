-- Removing a pos archives it, so periods that allocated it keep their numbers (spec §4.4: changes apply to
-- the next salary only). Allocations can no longer be cascaded away by deleting a pos.
alter table public.budget_groups add column archived_at timestamptz;
alter table public.budget_groups drop constraint budget_groups_user_id_name_key;
create unique index budget_groups_active_name on public.budget_groups (user_id, name) where archived_at is null;
alter table public.budget_allocations
  drop constraint budget_allocations_group_id_user_id_fkey,
  add constraint budget_allocations_group_id_user_id_fkey
    foreign key (group_id, user_id) references public.budget_groups (id, user_id) on delete restrict;
