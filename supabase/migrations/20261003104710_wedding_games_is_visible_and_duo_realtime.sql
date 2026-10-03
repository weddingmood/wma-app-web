create table if not exists public.wedding_games (
  id uuid primary key default gen_random_uuid(),
  slug text,
  name text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.wedding_games add column if not exists slug text;
alter table public.wedding_games add column if not exists name text;
alter table public.wedding_games add column if not exists is_visible boolean not null default true;
create unique index if not exists wedding_games_slug_key on public.wedding_games (slug);
alter table public.wedding_games enable row level security;
insert into public.wedding_games (slug, name) values
  ('ludo','Ludo'), ('awale','Awalé'), ('dames','Dames'), ('mots','Défi des Mots')
on conflict (slug) do nothing;