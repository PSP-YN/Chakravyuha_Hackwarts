drop policy if exists "participants read own audit events" on public.platform_audit_events;
drop policy if exists "participants read own and related audit events" on public.platform_audit_events;
create policy "participants read own and related audit events" on public.platform_audit_events
for select to authenticated
using (
  actor_id = (select auth.uid())
  or public.is_platform_admin()
  or (table_name = 'user_profiles' and record_id = (select auth.uid())::text)
  or exists (select 1 from public.market_listings l where table_name='market_listings' and l.id::text=record_id and l.owner_id=(select auth.uid()))
  or exists (select 1 from public.market_offers o where table_name='market_offers' and o.id::text=record_id and (o.buyer_id=(select auth.uid()) or o.owner_id=(select auth.uid())))
  or exists (select 1 from public.machinery_bookings b where table_name='machinery_bookings' and b.id::text=record_id and (b.requester_id=(select auth.uid()) or b.provider_id=(select auth.uid())))
  or exists (select 1 from public.machinery_booking_events e join public.machinery_bookings b on b.id=e.booking_id where table_name='machinery_booking_events' and e.id::text=record_id and (b.requester_id=(select auth.uid()) or b.provider_id=(select auth.uid())))
  or exists (select 1 from public.machinery_booking_evidence e join public.machinery_bookings b on b.id=e.booking_id where table_name='machinery_booking_evidence' and e.id::text=record_id and (b.requester_id=(select auth.uid()) or b.provider_id=(select auth.uid())))
  or exists (select 1 from public.farmloop_processor_acceptances f where table_name='farmloop_processor_acceptances' and f.id::text=record_id and (f.listing_owner_id=(select auth.uid()) or f.processor_id=(select auth.uid())))
  or exists (select 1 from public.material_quality_checks q join public.market_listings l on l.id=q.listing_id where table_name='material_quality_checks' and q.id::text=record_id and (q.submitted_by=(select auth.uid()) or q.verified_by=(select auth.uid()) or l.owner_id=(select auth.uid())))
  or exists (select 1 from public.participant_reports r where table_name='participant_reports' and r.id::text=record_id and (r.reporter_id=(select auth.uid()) or r.reported_user_id=(select auth.uid())))
  or exists (select 1 from public.market_disputes d join public.market_offers o on o.id=d.offer_id where table_name='market_disputes' and d.id::text=record_id and (d.opened_by=(select auth.uid()) or o.buyer_id=(select auth.uid()) or o.owner_id=(select auth.uid())))
  or exists (select 1 from public.listing_moderation_actions m join public.market_listings l on l.id=m.listing_id where table_name='listing_moderation_actions' and m.id::text=record_id and l.owner_id=(select auth.uid()))
);
create index if not exists platform_audit_events_record_idx
on public.platform_audit_events(table_name,record_id,occurred_at desc);
