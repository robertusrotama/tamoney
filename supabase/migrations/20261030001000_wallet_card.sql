-- Card details for bank/credit wallets. card_enc = AES-256-GCM ciphertext (lib/crypto.ts, key only in the
-- server env) of {number, expiry, holder}; only the last 4 digits are stored readable for display. No CVV, ever.
alter table public.wallets
  add column card_enc text check (char_length(card_enc) <= 1000),
  add column card_last4 text check (card_last4 ~ '^[0-9]{4}$');
