-- Profile avatar: an emoji ("memoji") on a color, never a photo. Null = initial letter.
alter table public.profiles
  add column avatar text check (char_length(avatar) <= 16),
  add column avatar_color text check (avatar_color in ('blue', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'teal', 'graphite'));
