-- Structured category data and participant-safe offer withdrawal for pilot workflows.
alter table public.market_listings
  add column if not exists machinery_operation text,
  add column if not exists machinery_hp_min numeric(6,2),
  add column if not exists machinery_hp_max numeric(6,2),
  add column if not exists machinery_implement text,
  add column if not exists machinery_operator_included boolean,
  add column if not exists machinery_fuel_responsibility text,
  add column if not exists machinery_min_hours numeric(8,2),
  add column if not exists machinery_available_from date,
  add column if not exists machinery_available_until date,
  add column if not exists byproduct_material text,
  add column if not exists byproduct_moisture_pct numeric(5,2),
  add column if not exists byproduct_contamination_pct numeric(5,2),
  add column if not exists byproduct_collection_radius_km numeric(7,2),
  add column if not exists byproduct_available_until date;

alter table public.market_listings
  add constraint machinery_hp_range_valid check (
    (machinery_hp_min is null or machinery_hp_min > 0) and
    (machinery_hp_max is null or machinery_hp_max > 0) and
    (machinery_hp_min is null or machinery_hp_max is null or machinery_hp_max >= machinery_hp_min)
  ),
  add constraint machinery_min_hours_valid check (machinery_min_hours is null or machinery_min_hours > 0),
  add constraint machinery_dates_valid check (machinery_available_until is null or machinery_available_from is null or machinery_available_until >= machinery_available_from),
  add constraint byproduct_moisture_valid check (byproduct_moisture_pct is null or byproduct_moisture_pct between 0 and 100),
  add constraint byproduct_contamination_valid check (byproduct_contamination_pct is null or byproduct_contamination_pct between 0 and 100),
  add constraint byproduct_radius_valid check (byproduct_collection_radius_km is null or byproduct_collection_radius_km > 0);

-- Buyers may withdraw only their own pending offers. Sellers retain decision rights.
drop policy if exists "seller updates offer status" on public.market_offers;
create policy "parties update permitted offer status" on public.market_offers
for update to authenticated
using (buyer_id = (select auth.uid()) or owner_id = (select auth.uid()))
with check (buyer_id = (select auth.uid()) or owner_id = (select auth.uid()));

create or replace function public.guard_offer_status_transition()
returns trigger language plpgsql set search_path=''
as $$
begin
 if new.status = old.status then return new; end if;
 if old.status = 'pending' and new.status in ('accepted','rejected','withdrawn') then
   if new.status = 'withdrawn' and old.buyer_id <> (select auth.uid()) then
     raise exception 'Only the buyer can withdraw a pending offer';
   end if;
   if new.status in ('accepted','rejected') and old.owner_id <> (select auth.uid()) then
     raise exception 'Only the seller can decide a pending offer';
   end if;
   return new;
 end if;
 if old.status = 'accepted' and new.status = 'completed' and old.owner_id = (select auth.uid()) then return new; end if;
 raise exception 'Invalid offer status transition';
end;
$$;

-- Listing status changes are limited to active -> paused/closed and paused -> active/closed.
create or replace function public.guard_listing_status_transition()
returns trigger language plpgsql set search_path=''
as $$
begin
 if new.status = old.status then return new; end if;
 if old.owner_id <> (select auth.uid()) then raise exception 'Only the listing owner can change listing status'; end if;
 if (old.status = 'active' and new.status in ('paused','closed')) or
    (old.status = 'paused' and new.status in ('active','closed')) then return new; end if;
 raise exception 'Invalid listing status transition';
end;
$$;
drop trigger if exists guard_market_listing_status on public.market_listings;
create trigger guard_market_listing_status before update of status on public.market_listings
for each row execute function public.guard_listing_status_transition();

-- Preserve the least-privilege API surface.
revoke all privileges on public.market_listings from anon, authenticated;
revoke all privileges on public.market_offers from anon, authenticated;
grant select on public.market_listings to anon, authenticated;
grant insert, update, delete on public.market_listings to authenticated;
grant select, insert on public.market_offers to authenticated;
grant update(status) on public.market_offers to authenticated;
