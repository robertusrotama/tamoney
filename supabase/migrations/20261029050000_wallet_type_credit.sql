-- Kartu Kredit gets its own wallet type (own stack on the Dompet page).
alter type public.wallet_type add value if not exists 'credit' after 'ewallet';
