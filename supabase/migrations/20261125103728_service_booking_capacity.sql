-- Machinery service request windows and accepted-quantity reservation guard.
alter table public.market_offers
  add column if not exists requested_start_at timestamptz,
  add column if not exists requested_duration_hours numeric(8,2);
alter table public.market_offers
  add constraint requested_duration_positive check (requested_duration_hours is null or requested_duration_hours > 0),
  add constraint requested_start_requires_duration check (requested_start_at is null or requested_duration_hours is not null);

create or replace function public.guard_offer_status_transition()
returns trigger language plpgsql set search_path=''
as $$
declare
 listing_qty numeric(14,3);
 reserved_qty numeric(14,3);
begin
 if new.status = old.status then return new; end if;
 if old.status = 'pending' and new.status in ('accepted','rejected','withdrawn') then
   if new.status = 'withdrawn' and old.buyer_id <> (select auth.uid()) then raise exception 'Only the buyer can withdraw a pending offer'; end if;
   if new.status in ('accepted','rejected') and old.owner_id <> (select auth.uid()) then raise exception 'Only the seller can decide a pending offer'; end if;
   if new.status = 'accepted' then
     select l.quantity into listing_qty from public.market_listings l where l.id = old.listing_id for update;
     select coalesce(sum(o.accepted_quantity),0) into reserved_qty from public.market_offers o
       where o.listing_id = old.listing_id and o.id <> old.id and o.status in ('accepted','completed');
     if reserved_qty + new.accepted_quantity > listing_qty then raise exception 'Accepted offers cannot exceed the listing quantity'; end if;
   end if;
   return new;
 end if;
 if old.status = 'accepted' and new.status = 'completed' and old.owner_id = (select auth.uid()) then return new; end if;
 raise exception 'Invalid offer status transition';
end;
$$;
