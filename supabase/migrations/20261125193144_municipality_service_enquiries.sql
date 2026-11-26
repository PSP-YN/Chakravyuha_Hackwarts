-- Farmers can ask the official contact about waste collection; municipality users
-- in the same district can acknowledge, refer or close the enquiry. This is not a pickup booking.
create table if not exists public.municipality_service_enquiries (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.municipality_contacts(id) on delete restrict,
  requester_id uuid not null references auth.users(id) on delete restrict,
  material_type text not null check (material_type in ('crop_residue','animal_manure','plastic_packaging','chemical_container','contaminated','mixed','other')),
  quantity numeric(14,3) check (quantity is null or quantity > 0),
  unit text check (unit is null or unit in ('kg','quintal','tonne','lot')),
  pickup_location text not null check (char_length(btrim(pickup_location)) between 2 and 160),
  message text not null check (char_length(btrim(message)) between 10 and 1000),
  status text not null default 'submitted' check (status in ('submitted','acknowledged','information_provided','referred','closed','withdrawn')),
  municipality_user_id uuid references auth.users(id) on delete set null,
  response_note text check (response_note is null or char_length(response_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((quantity is null and unit is null) or (quantity is not null and unit is not null))
);
create index if not exists municipality_enquiries_requester_idx on public.municipality_service_enquiries(requester_id,created_at desc);
create index if not exists municipality_enquiries_contact_status_idx on public.municipality_service_enquiries(contact_id,status,created_at desc);
create index if not exists municipality_enquiries_assignee_idx on public.municipality_service_enquiries(municipality_user_id,status,updated_at desc);
alter table public.municipality_service_enquiries enable row level security;
create policy "enquiry parties read" on public.municipality_service_enquiries for select to authenticated using (
  requester_id=(select auth.uid()) or public.is_platform_admin() or exists (
    select 1 from public.municipality_contacts c join public.user_profiles p on p.user_id=(select auth.uid())
    where c.id=contact_id and p.participant_type='municipality' and p.verification_status='verified' and lower(btrim(p.district))=lower(btrim(c.district))
  )
);
create policy "participants submit municipality enquiries" on public.municipality_service_enquiries for insert to authenticated with check (
  requester_id=(select auth.uid()) and status='submitted' and municipality_user_id is null and response_note is null
  and exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.profile_completed and p.participant_type<>'municipality')
  and exists (
    select 1 from public.municipality_contacts c
    join public.user_profiles p on p.user_id=(select auth.uid())
    where c.id=contact_id and c.is_active
      and lower(btrim(p.district))=lower(btrim(c.district))
  )
);
create policy "enquiry parties update" on public.municipality_service_enquiries for update to authenticated
  using (requester_id=(select auth.uid()) or public.is_platform_admin() or exists (
    select 1 from public.municipality_contacts c join public.user_profiles p on p.user_id=(select auth.uid())
    where c.id=contact_id and p.participant_type='municipality' and p.verification_status='verified' and lower(btrim(p.district))=lower(btrim(c.district))
  ))
  with check (requester_id=(select auth.uid()) or public.is_platform_admin() or exists (
    select 1 from public.municipality_contacts c join public.user_profiles p on p.user_id=(select auth.uid())
    where c.id=contact_id and p.participant_type='municipality' and p.verification_status='verified' and lower(btrim(p.district))=lower(btrim(c.district))
  ));
revoke all on public.municipality_service_enquiries from anon,authenticated;
grant select,insert,update on public.municipality_service_enquiries to authenticated;

create table if not exists public.municipality_service_enquiry_events (
  id bigint generated always as identity primary key,
  enquiry_id uuid not null references public.municipality_service_enquiries(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('submitted','acknowledged','information_provided','referred','closed','withdrawn')),
  old_status text,
  new_status text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists municipality_enquiry_events_idx on public.municipality_service_enquiry_events(enquiry_id,created_at desc);
alter table public.municipality_service_enquiry_events enable row level security;
create policy "enquiry parties read timeline" on public.municipality_service_enquiry_events for select to authenticated using (
  exists (select 1 from public.municipality_service_enquiries e where e.id=enquiry_id and (
    e.requester_id=(select auth.uid()) or public.is_platform_admin() or exists (
      select 1 from public.municipality_contacts c join public.user_profiles p on p.user_id=(select auth.uid())
      where c.id=e.contact_id and p.participant_type='municipality' and p.verification_status='verified' and lower(btrim(p.district))=lower(btrim(c.district))
    )
  ))
);
revoke all on public.municipality_service_enquiry_events from anon,authenticated;
grant select on public.municipality_service_enquiry_events to authenticated;

create or replace function private.guard_municipality_enquiry_update()
returns trigger language plpgsql set search_path = ''
as $$
declare actor uuid := auth.uid(); municipality_actor boolean;
begin
  if new.contact_id is distinct from old.contact_id or new.requester_id is distinct from old.requester_id
    or new.material_type is distinct from old.material_type or new.quantity is distinct from old.quantity
    or new.unit is distinct from old.unit or new.pickup_location is distinct from old.pickup_location
    or new.message is distinct from old.message then
    raise exception 'Enquiry details cannot be changed after submission';
  end if;
  if new.status=old.status then raise exception 'Choose a valid enquiry status transition'; end if;
  if public.is_platform_admin() then return new; end if;
  municipality_actor := exists (
    select 1 from public.municipality_contacts c join public.user_profiles p on p.user_id=actor
    where c.id=old.contact_id and p.participant_type='municipality' and p.verification_status='verified' and lower(btrim(p.district))=lower(btrim(c.district))
  );
  if actor=old.requester_id and old.status='submitted' and new.status='withdrawn'
    and new.municipality_user_id is not distinct from old.municipality_user_id
    and new.response_note is not distinct from old.response_note then return new; end if;
  if municipality_actor then
    if old.municipality_user_id is not null and old.municipality_user_id<>actor then raise exception 'This enquiry is already assigned to another municipality user'; end if;
    if old.status not in ('submitted','acknowledged','referred','information_provided')
      or new.status not in ('acknowledged','information_provided','referred','closed') then
      raise exception 'Invalid municipality enquiry status transition';
    end if;
    if new.status in ('information_provided','referred','closed') and char_length(btrim(coalesce(new.response_note,'')))<5 then
      raise exception 'Add a response note before referring or closing the enquiry';
    end if;
    new.municipality_user_id := actor;
    return new;
  end if;
  raise exception 'Only the requester or a municipality contact in the matching district may update this enquiry';
end;
$$;
revoke all on function private.guard_municipality_enquiry_update() from public,anon,authenticated;
create trigger guard_municipality_enquiry_update before update on public.municipality_service_enquiries
for each row execute function private.guard_municipality_enquiry_update();
create trigger municipality_enquiries_updated_at before update on public.municipality_service_enquiries
for each row execute function public.set_updated_at();

create or replace function private.log_municipality_enquiry_event()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.municipality_service_enquiry_events(enquiry_id,actor_id,event_type,old_status,new_status,note)
  values(new.id,auth.uid(),new.status,case when tg_op='INSERT' then null else old.status end,new.status,coalesce(new.response_note,new.message));
  insert into public.platform_audit_events(actor_id,table_name,record_id,action,changed_fields)
  values(auth.uid(),'municipality_service_enquiries',new.id::text,case when tg_op='INSERT' then 'INSERT' else 'UPDATE' end,
    case when tg_op='INSERT' then array['contact_id','material_type','quantity','pickup_location','message']::text[] else array['status','response_note','municipality_user_id']::text[] end);
  return new;
end;
$$;
revoke all on function private.log_municipality_enquiry_event() from public,anon,authenticated;
create trigger log_municipality_enquiry_event after insert or update of status on public.municipality_service_enquiries
for each row execute function private.log_municipality_enquiry_event();

alter table public.participant_notifications drop constraint if exists participant_notifications_event_type_check;
alter table public.participant_notifications add constraint participant_notifications_event_type_check check (event_type in (
  'offer_received','offer_accepted','offer_rejected','offer_withdrawn','offer_completed',
  'processor_request_received','processor_request_accepted','processor_request_rejected','processor_request_withdrawn',
  'booking_created','booking_updated','booking_rescheduled','booking_cancelled','booking_started','booking_completed',
  'dispute_opened','dispute_updated','report_submitted','report_updated','quality_check_submitted','quality_check_updated','listing_moderated',
  'transport_job_confirmed','transport_pickup_ready','transport_picked_up','transport_in_transit','transport_delivered','transport_completed','transport_cancelled','transport_evidence_added',
  'municipality_request_submitted','municipality_request_updated'
));

create or replace function private.notify_municipality_enquiry()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare contact_district text; recipient uuid; kind text; title_en text; body_en text; title_kn text; body_kn text;
begin
  select district into contact_district from public.municipality_contacts where id=new.contact_id;
  if tg_op='INSERT' then
    kind:='municipality_request_submitted';title_en:='New local waste-service enquiry';body_en:='A participant submitted a waste collection or disposal enquiry for your district.';title_kn:='ಸ್ಥಳೀಯ ತ್ಯಾಜ್ಯ ಸೇವೆಯ ಹೊಸ ವಿಚಾರಣೆ';body_kn:='ನಿಮ್ಮ ಜಿಲ್ಲೆಯ ತ್ಯಾಜ್ಯ ಸಂಗ್ರಹ ಅಥವಾ ವಿಲೇವಾರಿ ಕುರಿತು ಭಾಗವಹಿಸುವವರು ವಿಚಾರಣೆ ಸಲ್ಲಿಸಿದ್ದಾರೆ.';
    for recipient in select p.user_id from public.user_profiles p where p.participant_type='municipality' and p.verification_status='verified' and lower(btrim(p.district))=lower(btrim(contact_district)) loop
      insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
      values(recipient,new.requester_id,kind,title_en,body_en,title_kn,body_kn,'municipality_service_enquiries',new.id::text);
    end loop;
  elsif new.status is distinct from old.status then
    kind:='municipality_request_updated';
    title_en:='Municipality enquiry status updated';body_en:=coalesce(new.response_note,'The municipality updated your enquiry. Open the enquiry timeline for details.');
    title_kn:='ಪುರಸಭೆ ವಿಚಾರಣೆಯ ಸ್ಥಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ';body_kn:='ಪುರಸಭೆಯು ನಿಮ್ಮ ವಿಚಾರಣೆಯನ್ನು ನವೀಕರಿಸಿದೆ. ವಿವರಗಳಿಗಾಗಿ ವಿಚಾರಣೆ ಇತಿಹಾಸವನ್ನು ನೋಡಿ.';
    insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
    values(new.requester_id,auth.uid(),kind,title_en,body_en,title_kn,body_kn,'municipality_service_enquiries',new.id::text);
  end if;
  return new;
end;
$$;
revoke all on function private.notify_municipality_enquiry() from public,anon,authenticated;
create trigger notify_municipality_enquiry after insert or update of status on public.municipality_service_enquiries
for each row execute function private.notify_municipality_enquiry();
