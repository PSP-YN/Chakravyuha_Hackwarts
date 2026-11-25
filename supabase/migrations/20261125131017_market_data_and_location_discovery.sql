alter table public.market_listings
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists service_radius_km numeric(7,2);
do $$ begin
  if not exists (select 1 from pg_constraint where conname='listing_latitude_range') then
    alter table public.market_listings add constraint listing_latitude_range check (latitude is null or latitude between -90 and 90);
  end if;
  if not exists (select 1 from pg_constraint where conname='listing_longitude_range') then
    alter table public.market_listings add constraint listing_longitude_range check (longitude is null or longitude between -180 and 180);
  end if;
  if not exists (select 1 from pg_constraint where conname='listing_coordinate_pair') then
    alter table public.market_listings add constraint listing_coordinate_pair check ((latitude is null) = (longitude is null));
  end if;
  if not exists (select 1 from pg_constraint where conname='listing_service_radius_positive') then
    alter table public.market_listings add constraint listing_service_radius_positive check (service_radius_km is null or service_radius_km > 0);
  end if;
end $$;
create index if not exists listings_geo_idx
  on public.market_listings (category, status, latitude, longitude)
  where latitude is not null and longitude is not null;

create table if not exists public.market_price_observations (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_record_id text,
  source_url text not null,
  source_license text not null,
  state text not null,
  district text not null,
  market text not null,
  commodity text not null,
  variety text,
  grade text,
  arrival_date date not null,
  min_price_per_quintal numeric(14,2),
  max_price_per_quintal numeric(14,2),
  modal_price_per_quintal numeric(14,2),
  arrival_quantity numeric(16,3),
  arrival_unit text,
  currency text not null default 'INR',
  price_unit text not null default 'quintal',
  retrieved_at timestamptz not null default now(),
  parser_version text not null,
  freshness_status text not null default 'current'
    check (freshness_status in ('current','stale','historical')),
  created_at timestamptz not null default now(),
  constraint market_price_nonnegative check (
    (min_price_per_quintal is null or min_price_per_quintal >= 0) and
    (max_price_per_quintal is null or max_price_per_quintal >= 0) and
    (modal_price_per_quintal is null or modal_price_per_quintal >= 0) and
    (arrival_quantity is null or arrival_quantity >= 0)
  ),
  constraint market_price_range check (
    min_price_per_quintal is null or max_price_per_quintal is null or min_price_per_quintal <= max_price_per_quintal
  )
);
create unique index if not exists market_price_source_record_unique
  on public.market_price_observations (source, coalesce(source_record_id,''), arrival_date, market, commodity, coalesce(variety,''));
create index if not exists market_prices_lookup_idx
  on public.market_price_observations (state, district, commodity, arrival_date desc);
create index if not exists market_prices_market_idx
  on public.market_price_observations (market, commodity, arrival_date desc);
alter table public.market_price_observations enable row level security;
drop policy if exists "public can read market price observations" on public.market_price_observations;
create policy "public can read market price observations"
  on public.market_price_observations for select to anon, authenticated using (true);
revoke all on public.market_price_observations from anon, authenticated;
grant select on public.market_price_observations to anon, authenticated;
grant usage on schema public to anon, authenticated;
