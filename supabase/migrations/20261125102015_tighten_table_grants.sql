-- Restrict the public market tables to the privileges used by the application.
revoke all privileges on table public.market_listings from anon, authenticated;
grant select on public.market_listings to anon, authenticated;
grant insert, update, delete on public.market_listings to authenticated;
grant update(status) on public.market_listings to authenticated;

revoke all privileges on table public.market_offers from anon, authenticated;
grant select, insert on public.market_offers to authenticated;
grant update(status) on public.market_offers to authenticated;
