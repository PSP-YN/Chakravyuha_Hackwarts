create index if not exists participant_notifications_actor_id_idx
  on public.participant_notifications(actor_id);

drop policy if exists "admins read listing moderation history" on public.listing_moderation_actions;
drop policy if exists "listing owners read their moderation history" on public.listing_moderation_actions;
create policy "admins and owners read listing moderation history"
  on public.listing_moderation_actions for select to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.market_listings l
      where l.id = listing_moderation_actions.listing_id
        and l.owner_id = (select auth.uid())
    )
  );
