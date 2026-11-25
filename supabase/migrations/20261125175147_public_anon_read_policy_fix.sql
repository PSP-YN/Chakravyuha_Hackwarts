drop policy if exists "listings discoverable by visibility" on public.market_listings;
create policy "anon reads active listings"
  on public.market_listings for select to anon
  using (status = 'active');
create policy "authenticated reads visible listings"
  on public.market_listings for select to authenticated
  using (status = 'active' or owner_id = (select auth.uid()) or public.is_platform_admin());

drop policy if exists "public reads active municipality contacts" on public.municipality_contacts;
drop policy if exists "published contacts and admins read" on public.municipality_contacts;
create policy "anon reads active municipality contacts"
  on public.municipality_contacts for select to anon
  using (is_active = true);
create policy "authenticated reads active municipality contacts or admins"
  on public.municipality_contacts for select to authenticated
  using (is_active = true or public.is_platform_admin());
