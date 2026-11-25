-- Scope FarmLoop quality-check access to the exact listing for which a processor
-- has an accepted request. The previous policies compared a.listing_id to itself.
drop policy if exists "listing owner or processor submits quality" on public.material_quality_checks;
create policy "listing owner or processor submits quality"
on public.material_quality_checks for insert to authenticated
with check (
  submitted_by = (select auth.uid())
  and verification_status = 'pending'
  and verified_by is null
  and (
    exists (
      select 1 from public.market_listings l
      where l.id = material_quality_checks.listing_id
        and l.category = 'byproduct'
        and l.owner_id = (select auth.uid())
    )
    or exists (
      select 1 from public.farmloop_processor_acceptances a
      where a.listing_id = material_quality_checks.listing_id
        and a.processor_id = (select auth.uid())
        and a.status = 'accepted'
    )
  )
);

drop policy if exists "quality checks visible to listing parties" on public.material_quality_checks;
create policy "quality checks visible to listing parties"
on public.material_quality_checks for select to authenticated
using (
  public.is_platform_admin()
  or submitted_by = (select auth.uid())
  or exists (
    select 1 from public.market_listings l
    where l.id = material_quality_checks.listing_id
      and l.owner_id = (select auth.uid())
  )
  or exists (
    select 1 from public.farmloop_processor_acceptances a
    where a.listing_id = material_quality_checks.listing_id
      and a.processor_id = (select auth.uid())
      and a.status = 'accepted'
  )
);
