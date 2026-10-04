create table if not exists public.voice_signals (
  id serial primary key,
  couple_id integer not null,
  from_partner text not null,
  kind text not null,
  payload text,
  created_at timestamptz not null default now()
);
create index if not exists voice_signals_couple_idx on public.voice_signals (couple_id, id);
alter table public.voice_signals enable row level security;