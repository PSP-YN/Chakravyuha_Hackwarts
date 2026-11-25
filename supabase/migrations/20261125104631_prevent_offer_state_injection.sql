-- Inserts may create proposals only; privileged state transitions happen after insertion.
drop policy if exists "buyer offers on active listings" on public.market_offers;
create policy "buyer offers on active listings" on public.market_offers
for insert to authenticated with check (
  status = 'pending' and buyer_id = (select auth.uid()) and owner_id <> (select auth.uid()) and exists (
    select 1 from public.market_listings l where l.id = listing_id and l.owner_id = market_offers.owner_id
      and l.status = 'active' and l.quantity >= market_offers.accepted_quantity
  )
);

drop policy if exists "owner inserts listings" on public.market_listings;
create policy "owner inserts listings" on public.market_listings
for insert to authenticated with check (owner_id = (select auth.uid()) and status = 'active');

create or replace function public.guard_new_offer_state()
returns trigger language plpgsql set search_path=''
as $$
begin
  if new.status <> 'pending' then raise exception 'New offers must start in pending status'; end if;
  if new.buyer_id <> (select auth.uid()) then raise exception 'Offer buyer must be the authenticated user'; end if;
  return new;
end;
$$;
drop trigger if exists guard_new_market_offer_state on public.market_offers;
create trigger guard_new_market_offer_state before insert on public.market_offers
for each row execute function public.guard_new_offer_state();
