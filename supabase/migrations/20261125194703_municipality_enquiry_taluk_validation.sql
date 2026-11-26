-- Add taluk matching to municipality assignment, state transitions and notices.
create or replace function private.guard_municipality_enquiry_update()
returns trigger language plpgsql set search_path='' as $$
declare actor uuid:=auth.uid(); municipality_actor boolean;
begin
 if new.contact_id is distinct from old.contact_id
   or new.requester_id is distinct from old.requester_id
   or new.material_type is distinct from old.material_type
   or new.quantity is distinct from old.quantity
   or new.unit is distinct from old.unit
   or new.pickup_location is distinct from old.pickup_location
   or new.message is distinct from old.message then
   raise exception 'Enquiry details cannot be changed after submission';
 end if;
 if new.status=old.status then raise exception 'Choose a valid enquiry status transition'; end if;
 if public.is_platform_admin() then return new; end if;
 municipality_actor:=exists(
   select 1 from public.municipality_contacts c
   join public.user_profiles p on p.user_id=actor
   where c.id=old.contact_id and p.participant_type='municipality'
     and p.verification_status='verified'
     and lower(btrim(p.district))=lower(btrim(c.district))
     and (c.taluk is null or lower(btrim(p.taluk))=lower(btrim(c.taluk)))
 );
 if actor=old.requester_id and old.status='submitted' and new.status='withdrawn'
   and new.municipality_user_id is not distinct from old.municipality_user_id
   and new.response_note is not distinct from old.response_note then return new; end if;
 if municipality_actor then
   if old.municipality_user_id is not null and old.municipality_user_id<>actor then
     raise exception 'This enquiry is already assigned to another municipality user';
   end if;
   if old.status not in('submitted','acknowledged','referred','information_provided')
     or new.status not in('acknowledged','information_provided','referred','closed') then
     raise exception 'Invalid municipality enquiry status transition';
   end if;
   if new.status in('information_provided','referred','closed')
     and char_length(btrim(coalesce(new.response_note,'')))<5 then
     raise exception 'Add a response note before referring or closing the enquiry';
   end if;
   new.municipality_user_id:=actor;
   return new;
 end if;
 raise exception 'Only the requester or an assigned municipality contact in the matching district and taluk may update this enquiry';
end;
$$;

create or replace function private.notify_municipality_enquiry()
returns trigger language plpgsql security definer set search_path='' as $$
declare contact_district text; contact_taluk text; recipient uuid; kind text;
 title_en text; body_en text; title_kn text; body_kn text;
begin
 select district,taluk into contact_district,contact_taluk
 from public.municipality_contacts where id=new.contact_id;
 if tg_op='INSERT' then
   kind:='municipality_request_submitted';
   title_en:='New local waste-service enquiry';
   body_en:='A participant submitted a waste collection or disposal enquiry for your district.';
   title_kn:='ಸ್ಥಳೀಯ ತ್ಯಾಜ್ಯ ಸೇವೆಯ ಹೊಸ ವಿಚಾರಣೆ';
   body_kn:='ನಿಮ್ಮ ಜಿಲ್ಲೆಯ ತ್ಯಾಜ್ಯ ಸಂಗ್ರಹ ಅಥವಾ ವಿಲೇವಾರಿ ಕುರಿತು ಭಾಗವಹಿಸುವವರು ವಿಚಾರಣೆ ಸಲ್ಲಿಸಿದ್ದಾರೆ.';
   for recipient in
     select p.user_id from public.user_profiles p
     where p.participant_type='municipality' and p.verification_status='verified'
       and lower(btrim(p.district))=lower(btrim(contact_district))
       and (contact_taluk is null or lower(btrim(p.taluk))=lower(btrim(contact_taluk)))
   loop
     insert into public.participant_notifications(
       recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id
     ) values (
       recipient,new.requester_id,kind,title_en,body_en,title_kn,body_kn,
       'municipality_service_enquiries',new.id::text
     );
   end loop;
 elsif new.status is distinct from old.status then
   kind:='municipality_request_updated';
   title_en:='Municipality enquiry status updated';
   body_en:=coalesce(new.response_note,'The municipality updated your enquiry. Open the enquiry timeline for details.');
   title_kn:='ಪುರಸಭೆ ವಿಚಾರಣೆಯ ಸ್ಥಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ';
   body_kn:='ಪುರಸಭೆಯು ನಿಮ್ಮ ವಿಚಾರಣೆಯನ್ನು ನವೀಕರಿಸಿದೆ. ವಿವರಗಳಿಗಾಗಿ ವಿಚಾರಣೆ ಇತಿಹಾಸವನ್ನು ನೋಡಿ.';
   insert into public.participant_notifications(
     recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id
   ) values (
     new.requester_id,auth.uid(),kind,title_en,body_en,title_kn,body_kn,
     'municipality_service_enquiries',new.id::text
   );
 end if;
 return new;
end;
$$;

drop policy if exists "participants submit municipality enquiries" on public.municipality_service_enquiries;
create policy "participants submit municipality enquiries"
on public.municipality_service_enquiries for insert to authenticated
with check (
 requester_id=(select auth.uid()) and status='submitted'
 and municipality_user_id is null and response_note is null
 and exists (
   select 1 from public.user_profiles p
   where p.user_id=(select auth.uid()) and p.profile_completed and p.participant_type<>'municipality'
 )
 and exists (
   select 1 from public.municipality_contacts c
   join public.user_profiles p on p.user_id=(select auth.uid())
   where c.id=contact_id and c.is_active
     and lower(btrim(p.district))=lower(btrim(c.district))
     and (c.taluk is null or lower(btrim(p.taluk))=lower(btrim(c.taluk)))
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
     and (c.taluk is null or lower(btrim(p.taluk))=lower(btrim(c.taluk)))
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
     and (c.taluk is null or lower(btrim(p.taluk))=lower(btrim(c.taluk)))
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
     and (c.taluk is null or lower(btrim(p.taluk))=lower(btrim(c.taluk)))
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
   e.requester_id=(select auth.uid()) or public.is_platform_admin() or (
    (e.municipality_user_id is null or e.municipality_user_id=(select auth.uid()))
    and exists (
     select 1 from public.municipality_contacts c
     join public.user_profiles p on p.user_id=(select auth.uid())
     where c.id=e.contact_id and p.participant_type='municipality'
       and p.verification_status='verified'
       and lower(btrim(p.district))=lower(btrim(c.district))
       and (c.taluk is null or lower(btrim(p.taluk))=lower(btrim(c.taluk)))
    )
   )
  )
 )
);
