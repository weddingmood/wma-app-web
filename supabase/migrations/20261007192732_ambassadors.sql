create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  flag text,
  currency_code text,
  currency_symbol text,
  region text check (region in ('Ouest','Centre','Nord','Est','Austral')),
  whatsapp_number text,
  is_active boolean not null default true,
  order_index integer not null default 0
);

create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

create table if not exists public.ambassadors (
  id serial primary key,
  name text not null,
  ambassador_code text unique,
  code_unique text unique,
  referral_slug text unique,
  country_slug text,
  city text,
  phone text,
  bio text,
  photo_url text,
  payment_method text not null default 'wave',
  payment_number text,
  payout_day integer not null default 5,
  pin_hash text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  total_clicks integer not null default 0,
  total_clients integer not null default 0,
  balance numeric not null default 0,
  total_sales numeric not null default 0,
  total_commissions numeric not null default 0,
  last_sale_at timestamptz,
  last_payout_at timestamptz,
  last_payout_amount numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.ambassador_clicks (
  id serial primary key,
  ambassador_id integer not null references public.ambassadors(id) on delete cascade,
  country_slug text,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists ambassador_clicks_amb_idx on public.ambassador_clicks (ambassador_id, created_at desc);

create table if not exists public.payouts (
  id serial primary key,
  ambassador_id integer not null references public.ambassadors(id),
  amount numeric not null,
  payment_method text,
  payment_number text,
  status text not null default 'en_attente' check (status in ('en_attente','envoye','paye','echoue')),
  payout_date timestamptz,
  proof_image text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.payments add column if not exists referral_code text;
alter table public.payments add column if not exists ambassador_id integer references public.ambassadors(id);
alter table public.payments add column if not exists commission_rate numeric;
alter table public.payments add column if not exists commission_amount integer;
alter table public.payments add column if not exists commission_credited boolean not null default false;

alter table public.countries enable row level security;
alter table public.site_settings enable row level security;
alter table public.ambassadors enable row level security;
alter table public.ambassador_clicks enable row level security;
alter table public.payouts enable row level security;

insert into public.site_settings (key, value) values
  ('commission_rate', '15'),
  ('payout_min_balance', '10000'),
  ('payout_day', '5')
on conflict (key) do nothing;

insert into public.countries (slug, name, flag, currency_code, currency_symbol, region, is_active, order_index)
select v.slug, v.name,
  chr(127462 + ascii(substr(upper(v.slug), 1, 1)) - 65) || chr(127462 + ascii(substr(upper(v.slug), 2, 1)) - 65),
  v.cc, v.cs, v.region, true, v.ord
from (values
  ('ci', U&'C\00F4te d''Ivoire', 'XOF', 'F CFA', 'Ouest', 1),
  ('bj', U&'B\00E9nin', 'XOF', 'F CFA', 'Ouest', 2),
  ('sn', U&'S\00E9n\00E9gal', 'XOF', 'F CFA', 'Ouest', 3),
  ('bf', 'Burkina Faso', 'XOF', 'F CFA', 'Ouest', 4),
  ('ml', 'Mali', 'XOF', 'F CFA', 'Ouest', 5),
  ('tg', 'Togo', 'XOF', 'F CFA', 'Ouest', 6),
  ('ne', 'Niger', 'XOF', 'F CFA', 'Ouest', 7),
  ('gw', U&'Guin\00E9e-Bissau', 'XOF', 'F CFA', 'Ouest', 8),
  ('cm', 'Cameroun', 'XAF', 'F CFA', 'Centre', 9),
  ('ga', 'Gabon', 'XAF', 'F CFA', 'Centre', 10),
  ('cg', 'Congo', 'XAF', 'F CFA', 'Centre', 11),
  ('cd', 'RD Congo', 'CDF', 'FC', 'Centre', 12),
  ('ao', 'Angola', 'AOA', 'Kz', 'Austral', 13),
  ('ma', 'Maroc', 'MAD', 'DH', 'Nord', 14),
  ('dz', U&'Alg\00E9rie', 'DZD', 'DA', 'Nord', 15),
  ('tn', 'Tunisie', 'TND', 'DT', 'Nord', 16),
  ('eg', U&'\00C9gypte', 'EGP', U&'E\00A3', 'Nord', 17),
  ('ng', 'Nigeria', 'NGN', U&'\20A6', 'Ouest', 18),
  ('gh', 'Ghana', 'GHS', U&'\20B5', 'Ouest', 19),
  ('ke', 'Kenya', 'KES', 'KSh', 'Est', 20),
  ('rw', 'Rwanda', 'RWF', 'FRw', 'Est', 21),
  ('za', 'Afrique du Sud', 'ZAR', 'R', 'Austral', 22)
) as v(slug, name, cc, cs, region, ord)
where not exists (select 1 from public.countries);