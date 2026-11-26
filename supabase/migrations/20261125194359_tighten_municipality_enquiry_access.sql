-- Enquiries are private to their requester, a matching verified municipality,
-- or a platform administrator. Events are readable only by the same parties.
alter table public.municipality_service_enquiries enable row level security;
alter table public.municipality_service_enquiry_events enable row level security;

revoke all on public.municipality_service_enquiries from anon, authenticated;
grant select, insert, update on public.municipality_service_enquiries to authenticated;
revoke all on public.municipality_service_enquiry_events from anon, authenticated;
grant select on public.municipality_service_enquiry_events to authenticated;

drop policy if exists "participants submit municipality enquiries" on public.municipality_service_enquiries;
create policy "participants submit municipality enquiries"
on public.municipality_service_enquiries for insert to authenticated
with check (
  requester_id=(select auth.uid())
  and status='submitted' and municipality_user_id is null and response_note is null
  and exists (
    select 1 from public.user_profiles p
    where p.user_id=(select auth.uid()) and p.profile_completed and p.participant_type<>'municipality'
  )
  and exists (
    select 1 from public.municipality_contacts c
    join public.user_profiles p on p.user_id=(select auth.uid())
    where c.id=contact_id and c.is_active
      and lower(btrim(p.district))=lower(btrim(c.district))
  )
);

drop policy if exists "enquiry parties read" on public.municipality_service_enquiries;
create policy "enquiry parties read"
on public.municipality_service_enquiries for select to authenticated
using (
  requester_id=(select auth.uid()) or public.is_platform_admin() or (
    (municipality_user_id is null or municipality_user_id=(select auth.uid()))
    and exists (
      select 1 from public.municipality_contacts c
      join public.user_profiles p on p.user_id=(select auth.uid())
      where c.id=contact_id and p.participant_type='municipality'
        and p.verification_status='verified'
        and lower(btrim(p.district))=lower(btrim(c.district))
    )
  )
);

drop policy if exists "enquiry parties update" on public.municipality_service_enquiries;
create policy "enquiry parties update"
on public.municipality_service_enquiries for update to authenticated
using (
  requester_id=(select auth.uid()) or public.is_platform_admin() or (
    (municipality_user_id is null or municipality_user_id=(select auth.uid()))
    and exists (
      select 1 from public.municipality_contacts c
      join public.user_profiles p on p.user_id=(select auth.uid())
      where c.id=contact_id and p.participant_type='municipality'
        and p.verification_status='verified'
        and lower(btrim(p.district))=lower(btrim(c.district))
    )
  )
)
with check (
  requester_id=(select auth.uid()) or public.is_platform_admin() or (
    (municipality_user_id is null or municipality_user_id=(select auth.uid()))
    and exists (
      select 1 from public.municipality_contacts c
      join public.user_profiles p on p.user_id=(select auth.uid())
      where c.id=contact_id and p.participant_type='municipality'
        and p.verification_status='verified'
        and lower(btrim(p.district))=lower(btrim(c.district))
    )
  )
);

drop policy if exists "enquiry parties read timeline" on public.municipality_service_enquiry_events;
create policy "enquiry parties read timeline"
on public.municipality_service_enquiry_events for select to authenticated
using (
  exists (
    select 1 from public.municipality_service_enquiries e
    where e.id=enquiry_id and (
      e.requester_id=(select auth.uid()) or public.is_platform_admin() or exists (
        select 1 from public.municipality_contacts c
        join public.user_profiles p on p.user_id=(select auth.uid())
        where c.id=e.contact_id and p.participant_type='municipality'
          and p.verification_status='verified'
          and lower(btrim(p.district))=lower(btrim(c.district))
      )
    )
  )
);
