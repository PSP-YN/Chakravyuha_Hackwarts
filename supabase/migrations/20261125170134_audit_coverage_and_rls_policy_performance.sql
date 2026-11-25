create index if not exists listing_moderation_admin_idx on public.listing_moderation_actions(admin_id);
create index if not exists listing_moderation_listing_idx on public.listing_moderation_actions(listing_id);
create index if not exists municipality_contacts_verified_by_idx on public.municipality_contacts(verified_by);
create index if not exists platform_audit_events_actor_idx on public.platform_audit_events(actor_id, occurred_at desc);

drop policy if exists "active listings discoverable" on public.market_listings;
drop policy if exists "admins discover all listings" on public.market_listings;
create policy "listings discoverable by visibility" on public.market_listings
for select to anon, authenticated using (
  status = 'active' or owner_id = (select auth.uid()) or public.is_platform_admin()
);

drop policy if exists "admins update listings" on public.market_listings;
drop policy if exists "owner updates listings" on public.market_listings;
create policy "owners and admins update listing status" on public.market_listings
for update to authenticated
using (owner_id = (select auth.uid()) or public.is_platform_admin())
with check (owner_id = (select auth.uid()) or public.is_platform_admin());

drop policy if exists "admins manage municipality contacts" on public.municipality_contacts;
drop policy if exists "public reads active municipality contacts" on public.municipality_contacts;
create policy "published contacts and admins read" on public.municipality_contacts
for select to anon, authenticated using (is_active = true or public.is_platform_admin());
create policy "admins insert municipality contacts" on public.municipality_contacts
for insert to authenticated with check (public.is_platform_admin());
create policy "admins update municipality contacts" on public.municipality_contacts
for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins delete municipality contacts" on public.municipality_contacts
for delete to authenticated using (public.is_platform_admin());

drop trigger if exists audit_participant_reports on public.participant_reports;
create trigger audit_participant_reports after insert or update or delete on public.participant_reports
for each row execute function private.write_platform_audit_event();
drop trigger if exists audit_market_disputes on public.market_disputes;
create trigger audit_market_disputes after insert or update or delete on public.market_disputes
for each row execute function private.write_platform_audit_event();
drop trigger if exists audit_material_quality_checks on public.material_quality_checks;
create trigger audit_material_quality_checks after insert or update or delete on public.material_quality_checks
for each row execute function private.write_platform_audit_event();
drop trigger if exists audit_listing_moderation_actions on public.listing_moderation_actions;
create trigger audit_listing_moderation_actions after insert or update or delete on public.listing_moderation_actions
for each row execute function private.write_platform_audit_event();
drop trigger if exists audit_machinery_booking_events on public.machinery_booking_events;
create trigger audit_machinery_booking_events after insert or update or delete on public.machinery_booking_events
for each row execute function private.write_platform_audit_event();
