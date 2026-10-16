-- Un "site" de suivi par couple (identifie par le slug de son invitation)
create table if not exists public.tracking_sites (
  id uuid primary key default gen_random_uuid(),
  couple_id integer not null unique references public.couples(id) on delete cascade,
  slug text not null unique,
  pixel_id text,
  capi_token_enc text,            -- jeton Conversions API chiffre (AES-256-GCM)
  test_event_code text,
  ad_spend numeric not null default 0,
  currency text not null default 'XOF',
  created_at timestamptz not null default now()
);

-- Evenements recus du navigateur (IP anonymisee, e-mail hache)
create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.tracking_sites(id) on delete cascade,
  event_id text not null,         -- identifiant de deduplication avec le pixel navigateur
  event_name text not null,       -- PageView | ViewContent | Lead | Purchase
  event_time timestamptz not null default now(),
  value numeric not null default 0,
  currency text not null default 'XOF',
  source text not null default 'direct',   -- facebook | google | direct | other
  campaign_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  fbp text,
  fbc text,
  fbclid text,
  email_hash text,                -- SHA-256, jamais l'e-mail en clair
  ip_anon text,                   -- IPv4 a.b.c.0 / IPv6 /48
  user_agent text,
  page_url text,
  referrer text,
  consent boolean not null default false,
  capi_status text not null default 'pending' check (capi_status in ('pending','sent','failed','skipped')),
  capi_attempts integer not null default 0,
  capi_response text,
  capi_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (site_id, event_id)
);
create index if not exists tracking_events_site_idx on public.tracking_events (site_id, created_at desc);
create index if not exists tracking_events_status_idx on public.tracking_events (site_id, capi_status);

alter table public.tracking_sites enable row level security;
alter table public.tracking_events enable row level security;