-- Enforce required module-specific details and prevent overlapping accepted service bookings.
alter table public.market_listings
  add constraint module_detail_required check (
    (category <> 'machinery' or nullif(btrim(machinery_operation), '') is not null) and
    (category <> 'byproduct' or nullif(btrim(byproduct_material), '') is not null)
  );

create or replace function public.guard_offer_status_transition()
returns trigger language plpgsql set search_path=''
as $$
declare
 listing_qty numeric(14,3);
 listing_status text;
 listing_category text;
 available_from date;
 available_until date;
 reserved_qty numeric(14,3);
begin
 if new.status = old.status then return new; end if;
 if old.status = 'pending' and new.status in ('accepted','rejected','withdrawn') then
   if new.status = 'withdrawn' and old.buyer_id <> (select auth.uid()) then raise exception 'Only the buyer can withdraw a pending offer'; end if;
   if new.status in ('accepted','rejected') and old.owner_id <> (select auth.uid()) then raise exception 'Only the seller can decide a pending offer'; end if;
   if new.status = 'accepted' then
     select l.quantity, l.status, l.category, l.machinery_available_from, l.machinery_available_until
       into listing_qty, listing_status, listing_category, available_from, available_until
       from public.market_listings l where l.id = old.listing_id for update;
     if listing_status <> 'active' then raise exception 'Only active listings can have offers accepted'; end if;
     select coalesce(sum(o.accepted_quantity),0) into reserved_qty from public.market_offers o
       where o.listing_id = old.listing_id and o.id <> old.id and o.status in ('accepted','completed');
     if reserved_qty + new.accepted_quantity > listing_qty then raise exception 'Accepted offers cannot exceed the listing quantity'; end if;
     if listing_category = 'machinery' then
       if new.requested_start_at is null or new.requested_duration_hours is null then raise exception 'Machinery offers require a requested start time and duration'; end if;
       if available_from is not null and new.requested_start_at::date < available_from then raise exception 'Requested date is before the service availability window'; end if;
       if available_until is not null and (new.requested_start_at + make_interval(hours => new.requested_duration_hours))::date > available_until then raise exception 'Requested service extends beyond the availability window'; end if;
       if exists (
         select 1 from public.market_offers o where o.listing_id = old.listing_id and o.id <> old.id
           and o.status in ('accepted','completed') and o.requested_start_at is not null and o.requested_duration_hours is not null
           and o.requested_start_at < new.requested_start_at + make_interval(hours => new.requested_duration_hours)
           and o.requested_start_at + make_interval(hours => o.requested_duration_hours) > new.requested_start_at
       ) then raise exception 'This machinery service time overlaps an accepted booking'; end if;
     end if;
   end if;
   return new;
 end if;
 if old.status = 'accepted' and new.status = 'completed' and old.owner_id = (select auth.uid()) then return new; end if;
 raise exception 'Invalid offer status transition';
end;
$$;
