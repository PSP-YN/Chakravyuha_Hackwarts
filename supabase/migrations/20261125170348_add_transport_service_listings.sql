alter table public.market_listings drop constraint if exists market_listings_category_check;
alter table public.market_listings add constraint market_listings_category_check
check (category = any (array['produce','machinery','byproduct','transport']::text[]));

alter table public.market_listings
  add column if not exists transport_vehicle_type text,
  add column if not exists transport_capacity_tonnes numeric(12,3),
  add column if not exists transport_origin text,
  add column if not exists transport_destination text,
  add column if not exists transport_service_radius_km numeric(8,2),
  add column if not exists transport_available_from date,
  add column if not exists transport_available_until date;

alter table public.market_listings drop constraint if exists transport_details_valid;
alter table public.market_listings add constraint transport_details_valid check (
  (category <> 'transport' or nullif(btrim(transport_vehicle_type),'') is not null)
  and (transport_capacity_tonnes is null or transport_capacity_tonnes > 0)
  and (transport_service_radius_km is null or transport_service_radius_km > 0)
  and (transport_available_from is null or transport_available_until is null or transport_available_until >= transport_available_from)
);

alter table public.market_listings drop constraint if exists module_detail_required;
alter table public.market_listings add constraint module_detail_required check (
  (category <> 'machinery' or nullif(btrim(machinery_operation),'') is not null)
  and (category <> 'byproduct' or nullif(btrim(byproduct_material),'') is not null)
  and (category <> 'transport' or nullif(btrim(transport_vehicle_type),'') is not null)
);

create index if not exists transport_listings_availability_idx
on public.market_listings(transport_available_from,transport_available_until)
where category='transport' and status='active';
