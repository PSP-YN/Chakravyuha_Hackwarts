drop policy if exists "listing owners read their moderation history" on public.listing_moderation_actions;
create policy "listing owners read their moderation history" on public.listing_moderation_actions
for select to authenticated
using (exists (select 1 from public.market_listings l where l.id=listing_moderation_actions.listing_id and l.owner_id=(select auth.uid())));
