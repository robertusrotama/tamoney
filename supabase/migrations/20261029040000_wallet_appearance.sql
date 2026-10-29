-- Per-wallet card look (Dompet → Ubah → Tampilan). Null = default color by wallet type, plain pattern.
-- Keys must match components/wallets/style.ts.
alter table public.wallets
  add column color text check (color in ('blue', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'teal', 'graphite')),
  add column pattern text check (pattern in ('plain', 'mesh', 'lines', 'waves', 'rings'));
