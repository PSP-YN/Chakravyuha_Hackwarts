-- KRISHI CONNECT 360 initial schema. Apply only to the dedicated project.
create extension if not exists pgcrypto;
create table if not exists public.market_listings (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 category text not null check(category in ('produce','machinery','byproduct')),
 title text not null check(char_length(title) between 3 and 120),
 description text check(description is null or char_length(description)<=1000),
 quantity numeric(14,3) not null check(quantity>0),
 unit text not null check(unit in ('quintal','kg','tonne','hour','acre','trip','lot')),
 price_paise bigint not null check(price_paise>=0),
 location text not null check(char_length(location) between 2 and 120),
 quality text check(quality is null or char_length(quality)<=200),
 status text not null default 'active' check(status in ('active','paused','closed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.market_offers (
 id uuid primary key default gen_random_uuid(),
 listing_id uuid not null references public.market_listings(id) on delete restrict,
 buyer_id uuid not null references auth.users(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 offered_price_paise bigint not null check(offered_price_paise>=0),
 accepted_quantity numeric(14,3) not null check(accepted_quantity>0),
 transport_cost_paise bigint not null default 0 check(transport_cost_paise>=0),
 handling_cost_paise bigint not null default 0 check(handling_cost_paise>=0),
 commission_cost_paise bigint not null default 0 check(commission_cost_paise>=0),
 other_cost_paise bigint not null default 0 check(other_cost_paise>=0),
 status text not null default 'pending' check(status in ('pending','accepted','rejected','withdrawn','completed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint different_parties check(buyer_id<>owner_id)
);
create index if not exists listings_discovery_idx on public.market_listings(category,status,created_at desc);
create index if not exists listings_owner_idx on public.market_listings(owner_id,created_at desc);
create index if not exists offers_buyer_idx on public.market_offers(buyer_id,created_at desc);
create index if not exists offers_owner_idx on public.market_offers(owner_id,created_at desc);
create index if not exists offers_listing_idx on public.market_offers(listing_id,status);
create or replace function public.set_updated_at() returns trigger language plpgsql set search_path=''
as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists listings_updated_at on public.market_listings;
create trigger listings_updated_at before update on public.market_listings for each row execute function public.set_updated_at();
drop trigger if exists offers_updated_at on public.market_offers;
create trigger offers_updated_at before update on public.market_offers for each row execute function public.set_updated_at();
alter table public.market_listings enable row level security;
alter table public.market_offers enable row level security;
drop policy if exists "active listings discoverable" on public.market_listings;
create policy "active listings discoverable" on public.market_listings for select to anon,authenticated using(status='active' or owner_id=(select auth.uid()));
drop policy if exists "owner inserts listings" on public.market_listings;
create policy "owner inserts listings" on public.market_listings for insert to authenticated with check(owner_id=(select auth.uid()));
drop policy if exists "owner updates listings" on public.market_listings;
create policy "owner updates listings" on public.market_listings for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists "owner deletes listings" on public.market_listings;
create policy "owner deletes listings" on public.market_listings for delete to authenticated using(owner_id=(select auth.uid()));
drop policy if exists "offer parties read" on public.market_offers;
create policy "offer parties read" on public.market_offers for select to authenticated using(buyer_id=(select auth.uid()) or owner_id=(select auth.uid()));
drop policy if exists "buyer offers on active listings" on public.market_offers;
create policy "buyer offers on active listings" on public.market_offers for insert to authenticated with check(
 buyer_id=(select auth.uid()) and owner_id<>(select auth.uid()) and exists(
  select 1 from public.market_listings l where l.id=listing_id and l.owner_id=market_offers.owner_id
  and l.status='active' and l.quantity>=market_offers.accepted_quantity
 )
);
drop policy if exists "seller updates offer status" on public.market_offers;
create policy "seller updates offer status" on public.market_offers for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));

-- Enforce the offer state machine at the database boundary, not only in the UI.
create or replace function public.guard_offer_status_transition()
returns trigger language plpgsql set search_path=''
as $
begin
 if new.status = old.status then return new; end if;
 if old.status = 'pending' and new.status in ('accepted','rejected') then return new; end if;
 if old.status = 'accepted' and new.status = 'completed' then return new; end if;
 raise exception 'Invalid offer status transition';
end;
$;
drop trigger if exists guard_market_offer_status on public.market_offers;
create trigger guard_market_offer_status before update of status on public.market_offers
for each row execute function public.guard_offer_status_transition();
-- Explicit Data API grants are paired with RLS; offers can only be updated at the status column.
grant usage on schema public to anon,authenticated;
grant select on public.market_listings to anon,authenticated;
grant insert,update,delete on public.market_listings to authenticated;
grant select,insert on public.market_offers to authenticated;
grant update(status) on public.market_offers to authenticated;
