-- Shortcut "Credit Card" maps to a wallet named "Kartu Kredit"; if the user renamed it (e.g. "Tokopedia Card"),
-- fall back to their first active wallet of type credit instead of failing.
create or replace function public.pintasan_add(
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
  if v_wallet.id is null and 'kartu kredit' = any (p_wallets) then
    select w.id, w.name into v_wallet
      from public.wallets w
     where w.user_id = v_user and w.archived_at is null and w.type = 'credit'
     order by w.created_at
     limit 1;
  end if;
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
