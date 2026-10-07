create table if not exists public.testimonials (
  id serial primary key,
  couple_id integer,
  couple_name text not null,
  city text,
  wedding_date text,
  content text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  photo_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create index if not exists testimonials_status_idx on public.testimonials (status, created_at desc);
alter table public.testimonials enable row level security;