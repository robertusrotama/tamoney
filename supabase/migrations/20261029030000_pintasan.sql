-- iPhone Shortcut ("Pintasan") API. Docs: docs/knowledge/database.md

create table public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 50),
  token_hash text not null unique, -- sha256 hex; the token itself is never stored
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index api_tokens_user_idx on public.api_tokens (user_id);

alter table public.api_tokens enable row level security;
create policy "own tokens" on public.api_tokens for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.api_tokens from anon;
grant select, insert, delete on public.api_tokens to authenticated;

/*
 * Records one transaction for the owner of p_token. The Shortcut has no Supabase session, so this is
 * the single privileged path: SECURITY DEFINER, but every row it touches is scoped to the user the
 * token belongs to. Without a valid token it does nothing. p_categories / p_wallets are lower-cased
 * candidate names, best first (mapping lives in lib/pintasan.ts).
 */
create function public.pintasan_add(
  p_token text,
  p_kind public.tx_kind,
  p_categories text[],
  p_wallets text[],
  p_amount bigint,
  p_note text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid;
  v_wallet record;
  v_category record;
begin
  if p_kind not in ('income', 'expense') then
    return jsonb_build_object('error', 'kind');
  end if;

  update public.api_tokens
     set last_used_at = now()
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  returning user_id into v_user;
  if v_user is null then
    return jsonb_build_object('error', 'token');
  end if;

  select w.id, w.name into v_wallet
    from public.wallets w
   where w.user_id = v_user and w.archived_at is null and lower(w.name) = any (p_wallets)
   order by array_position(p_wallets, lower(w.name))
   limit 1;
  if v_wallet.id is null then
    return jsonb_build_object('error', 'wallet', 'wallets',
      (select coalesce(jsonb_agg(w.name order by w.created_at), '[]') from public.wallets w
        where w.user_id = v_user and w.archived_at is null));
  end if;

  select c.id, c.name into v_category
    from public.categories c
   where c.user_id = v_user and c.kind::text = p_kind::text
     and lower(c.name) = any (p_categories || array['lainnya'])
   order by array_position(p_categories || array['lainnya'], lower(c.name))
   limit 1;
  if v_category.id is null then
    return jsonb_build_object('error', 'category');
  end if;

  insert into public.transactions (user_id, kind, amount, wallet_id, category_id, note)
  values (v_user, p_kind, p_amount, v_wallet.id, v_category.id, nullif(left(p_note, 200), ''));

  return jsonb_build_object('ok', true, 'wallet', v_wallet.name, 'category', v_category.name);
end;
$$;

-- Callable with the publishable key (the Shortcut has no session); the token is the credential.
-- Intentional: Supabase advisor 0028 flags this; signed-in sessions never need it, so anon only.
revoke execute on function public.pintasan_add(text, public.tx_kind, text[], text[], bigint, text) from public, authenticated;
grant execute on function public.pintasan_add(text, public.tx_kind, text[], text[], bigint, text) to anon;
