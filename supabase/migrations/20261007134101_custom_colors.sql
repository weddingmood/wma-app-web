create table if not exists public.couple_custom_colors (
  couple_id integer primary key references public.couples(id) on delete cascade,
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  base_theme_id integer,
  updated_at timestamptz not null default now()
);
alter table public.couple_custom_colors enable row level security;