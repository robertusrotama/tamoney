-- Investment accounts (Bibit, stocks, gold…) as their own wallet type and pocket on Dompet.
alter type public.wallet_type add value if not exists 'investment' after 'credit';
