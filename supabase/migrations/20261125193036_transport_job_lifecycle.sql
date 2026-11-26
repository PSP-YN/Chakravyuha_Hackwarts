-- A transport offer becomes a trackable job only when the listing owner accepts it.
alter table public.market_offers
  add column if not exists transport_pickup_location text,
  add column if not exists transport_destination text,
  add column if not exists transport_loading_responsibility text check (transport_loading_responsibility is null or transport_loading_responsibility in ('requester','transporter','shared','to_agree')),
  add column if not exists transport_unloading_responsibility text check (transport_unloading_responsibility is null or transport_unloading_responsibility in ('requester','transporter','shared','to_agree'));

create or replace function private.guard_transport_listing()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.category = 'transport' then
    if nullif(btrim(coalesce(new.transport_vehicle_type,'')),'') is null then raise exception 'Transport listings require a vehicle type'; end if;
    if new.transport_capacity_tonnes is null or new.transport_capacity_tonnes <= 0 then raise exception 'Transport listings require a positive load capacity'; end if;
    if nullif(btrim(coalesce(new.transport_origin,'')),'') is null or nullif(btrim(coalesce(new.transport_destination,'')),'') is null then
      raise exception 'Transport listings require pickup and destination details';
    end if;
    if new.transport_available_from is not null and new.transport_available_until is not null and new.transport_available_until < new.transport_available_from then
      raise exception 'Transport availability end date cannot precede its start date';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_transport_listing() from public,anon,authenticated;
drop trigger if exists guard_transport_listing_fields on public.market_listings;
create trigger guard_transport_listing_fields before insert or update of category,transport_vehicle_type,transport_capacity_tonnes,transport_origin,transport_destination,transport_available_from,transport_available_until on public.market_listings
for each row execute function private.guard_transport_listing();

create table if not exists public.transport_jobs (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null unique references public.market_offers(id) on delete restrict,
  listing_id uuid not null references public.market_listings(id) on delete restrict,
  requester_id uuid not null references auth.users(id) on delete restrict,
  transporter_id uuid not null references auth.users(id) on delete restrict,
  pickup_location text not null check (char_length(btrim(pickup_location)) between 2 and 160),
  destination text not null check (char_length(btrim(destination)) between 2 and 160),
  vehicle_type text not null check (char_length(btrim(vehicle_type)) between 2 and 100),
  capacity_tonnes numeric(10,2) not null check (capacity_tonnes > 0),
  scheduled_pickup timestamptz not null,
  loading_responsibility text not null check (loading_responsibility in ('requester','transporter','shared','to_agree')),
  unloading_responsibility text not null check (unloading_responsibility in ('requester','transporter','shared','to_agree')),
  status text not null default 'confirmed' check (status in ('confirmed','pickup_ready','picked_up','in_transit','delivered_pending_confirmation','completed','cancelled')),
  status_note text check (status_note is null or char_length(status_note) <= 500),
  cancellation_reason text check (cancellation_reason is null or char_length(cancellation_reason) between 5 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> transporter_id)
);
create index if not exists transport_jobs_requester_idx on public.transport_jobs(requester_id,created_at desc);
create index if not exists transport_jobs_transporter_idx on public.transport_jobs(transporter_id,status,scheduled_pickup);
create index if not exists transport_jobs_listing_idx on public.transport_jobs(listing_id,scheduled_pickup);
alter table public.transport_jobs enable row level security;
create policy "transport job parties read" on public.transport_jobs for select to authenticated
  using (requester_id=(select auth.uid()) or transporter_id=(select auth.uid()) or public.is_platform_admin());
create policy "transport job parties update" on public.transport_jobs for update to authenticated
  using (requester_id=(select auth.uid()) or transporter_id=(select auth.uid()))
  with check (requester_id=(select auth.uid()) or transporter_id=(select auth.uid()));
revoke all on public.transport_jobs from anon,authenticated;
grant select,update on public.transport_jobs to authenticated;

create table if not exists public.transport_job_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.transport_jobs(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('job_confirmed','pickup_ready','picked_up','in_transit','delivered_pending_confirmation','completed','cancelled','evidence_added')),
  old_status text,
  new_status text,
  note text check (note is null or char_length(note) <= 500),
  object_path text,
  created_at timestamptz not null default now(),
  check ((event_type='evidence_added' and object_path is not null and old_status is null and new_status is null) or (event_type<>'evidence_added' and object_path is null))
);
create index if not exists transport_job_events_job_idx on public.transport_job_events(job_id,created_at desc);
alter table public.transport_job_events enable row level security;
create policy "transport job parties read events" on public.transport_job_events for select to authenticated using (
  exists (select 1 from public.transport_jobs j where j.id=job_id and (j.requester_id=(select auth.uid()) or j.transporter_id=(select auth.uid()))) or public.is_platform_admin()
);
create policy "transport job parties add evidence events" on public.transport_job_events for insert to authenticated with check (
  event_type='evidence_added' and actor_id=(select auth.uid()) and object_path like job_id::text||'/'||(select auth.uid())::text||'/%'
  and exists (select 1 from public.transport_jobs j where j.id=job_id and (j.requester_id=(select auth.uid()) or j.transporter_id=(select auth.uid())))
);
revoke all on public.transport_job_events from anon,authenticated;
grant select,insert on public.transport_job_events to authenticated;
grant usage,select on sequence public.transport_job_events_id_seq to authenticated;

create or replace function private.create_transport_job_from_accepted_offer()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare l record;
begin
  if new.status <> 'accepted' or old.status = 'accepted' then return new; end if;
  select category,transport_origin,transport_destination,transport_vehicle_type,transport_capacity_tonnes,transport_available_from,transport_available_until
    into l from public.market_listings where id=new.listing_id;
  if not found or l.category <> 'transport' then return new; end if;
  if new.requested_start_at is null or new.requested_start_at<=now() then raise exception 'Transport offers require a future requested pickup time'; end if;
  if l.transport_available_from is not null and new.requested_start_at::date<l.transport_available_from then raise exception 'Pickup is before transporter availability'; end if;
  if l.transport_available_until is not null and new.requested_start_at::date>l.transport_available_until then raise exception 'Pickup is after transporter availability'; end if;
  insert into public.transport_jobs(offer_id,listing_id,requester_id,transporter_id,pickup_location,destination,vehicle_type,capacity_tonnes,scheduled_pickup,loading_responsibility,unloading_responsibility)
  values (new.id,new.listing_id,new.buyer_id,new.owner_id,
    coalesce(nullif(btrim(new.transport_pickup_location),''),l.transport_origin),
    coalesce(nullif(btrim(new.transport_destination),''),l.transport_destination),
    l.transport_vehicle_type,l.transport_capacity_tonnes,new.requested_start_at,
    coalesce(new.transport_loading_responsibility,'to_agree'),coalesce(new.transport_unloading_responsibility,'to_agree'))
  on conflict (offer_id) do nothing;
  return new;
end;
$$;
revoke all on function private.create_transport_job_from_accepted_offer() from public,anon,authenticated;
drop trigger if exists create_transport_job_from_accepted_offer on public.market_offers;
create trigger create_transport_job_from_accepted_offer after update of status on public.market_offers
for each row execute function private.create_transport_job_from_accepted_offer();

create or replace function private.guard_transport_job_update()
returns trigger language plpgsql set search_path = ''
as $$
declare actor uuid := auth.uid();
begin
  if new.offer_id<>old.offer_id or new.listing_id<>old.listing_id or new.requester_id<>old.requester_id or new.transporter_id<>old.transporter_id
    or new.pickup_location<>old.pickup_location or new.destination<>old.destination or new.vehicle_type<>old.vehicle_type
    or new.capacity_tonnes<>old.capacity_tonnes or new.scheduled_pickup<>old.scheduled_pickup
    or new.loading_responsibility<>old.loading_responsibility or new.unloading_responsibility<>old.unloading_responsibility then
    raise exception 'Transport job booking details are immutable after acceptance';
  end if;
  if new.status=old.status then raise exception 'Transport job status must advance through the workflow'; end if;
  if old.status='confirmed' and new.status='pickup_ready' and actor=old.transporter_id then return new; end if;
  if old.status='pickup_ready' and new.status='picked_up' and actor=old.transporter_id then return new; end if;
  if old.status='picked_up' and new.status='in_transit' and actor=old.transporter_id then return new; end if;
  if old.status='in_transit' and new.status='delivered_pending_confirmation' and actor=old.transporter_id then return new; end if;
  if old.status='delivered_pending_confirmation' and new.status='completed' and actor=old.requester_id then return new; end if;
  if old.status in ('confirmed','pickup_ready') and new.status='cancelled' and actor in (old.requester_id,old.transporter_id)
    and char_length(coalesce(new.cancellation_reason,''))>=5 then return new; end if;
  raise exception 'Invalid transport job transition for this participant';
end;
$$;
revoke all on function private.guard_transport_job_update() from public,anon,authenticated;
create trigger guard_transport_job_update before update on public.transport_jobs for each row execute function private.guard_transport_job_update();

create or replace function private.log_transport_job_event()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.transport_job_events(job_id,actor_id,event_type,old_status,new_status,note)
  values (new.id,auth.uid(),case when tg_op='INSERT' then 'job_confirmed' else new.status end,
    case when tg_op='INSERT' then null else old.status end,new.status,coalesce(new.cancellation_reason,new.status_note));
  return new;
end;
$$;
revoke all on function private.log_transport_job_event() from public,anon,authenticated;
create trigger log_transport_job_event after insert or update of status on public.transport_jobs for each row execute function private.log_transport_job_event();

create trigger transport_jobs_updated_at before update on public.transport_jobs for each row execute function public.set_updated_at();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('transport-evidence','transport-evidence',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "transport job parties upload evidence" on storage.objects for insert to authenticated with check (
  bucket_id='transport-evidence' and (storage.foldername(name))[2]=(select auth.uid()::text)
  and exists (select 1 from public.transport_jobs j where j.id::text=(storage.foldername(name))[1] and (j.requester_id=(select auth.uid()) or j.transporter_id=(select auth.uid())))
);
create policy "transport job parties read evidence" on storage.objects for select to authenticated using (
  bucket_id='transport-evidence' and (
    exists (select 1 from public.transport_jobs j where j.id::text=(storage.foldername(name))[1] and (j.requester_id=(select auth.uid()) or j.transporter_id=(select auth.uid())))
    or public.is_platform_admin()
  )
);


-- Preserve existing accepted transport offers when the lifecycle is introduced.
insert into public.transport_jobs(offer_id,listing_id,requester_id,transporter_id,pickup_location,destination,vehicle_type,capacity_tonnes,scheduled_pickup,loading_responsibility,unloading_responsibility)
select o.id,o.listing_id,o.buyer_id,o.owner_id,
  coalesce(nullif(btrim(o.transport_pickup_location),''),l.transport_origin),
  coalesce(nullif(btrim(o.transport_destination),''),l.transport_destination),
  l.transport_vehicle_type,l.transport_capacity_tonnes,o.requested_start_at,
  coalesce(o.transport_loading_responsibility,'to_agree'),coalesce(o.transport_unloading_responsibility,'to_agree')
from public.market_offers o join public.market_listings l on l.id=o.listing_id
where o.status='accepted' and l.category='transport' and o.requested_start_at is not null
  and nullif(btrim(coalesce(l.transport_origin,'')),'') is not null
  and nullif(btrim(coalesce(l.transport_destination,'')),'') is not null
  and nullif(btrim(coalesce(l.transport_vehicle_type,'')),'') is not null
  and l.transport_capacity_tonnes>0
on conflict (offer_id) do nothing;

alter table public.participant_notifications drop constraint if exists participant_notifications_event_type_check;
alter table public.participant_notifications add constraint participant_notifications_event_type_check check (event_type in (
  'offer_received','offer_accepted','offer_rejected','offer_withdrawn','offer_completed',
  'processor_request_received','processor_request_accepted','processor_request_rejected','processor_request_withdrawn',
  'booking_created','booking_updated','booking_rescheduled','booking_cancelled','booking_started','booking_completed',
  'dispute_opened','dispute_updated','report_submitted','report_updated','quality_check_submitted','quality_check_updated','listing_moderated',
  'transport_job_confirmed','transport_pickup_ready','transport_picked_up','transport_in_transit','transport_delivered','transport_completed','transport_cancelled','transport_evidence_added'
));

create or replace function private.notify_transport_job_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare recipient uuid; kind text; title_en text; body_en text; title_kn text; body_kn text;
begin
  if tg_op='INSERT' then
    kind:='transport_job_confirmed';title_en:='Transport job confirmed';body_en:='The transport request was accepted. Review the pickup, route and responsibilities.';title_kn:='ಸಾರಿಗೆ ಕೆಲಸ ದೃಢಪಟ್ಟಿದೆ';body_kn:='ಸಾರಿಗೆ ವಿನಂತಿ ಒಪ್ಪಲಾಗಿದೆ. ಪಿಕಪ್, ಮಾರ್ಗ ಮತ್ತು ಜವಾಬ್ದಾರಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.';
  else
    kind:=case new.status when 'pickup_ready' then 'transport_pickup_ready' when 'picked_up' then 'transport_picked_up' when 'in_transit' then 'transport_in_transit' when 'delivered_pending_confirmation' then 'transport_delivered' when 'completed' then 'transport_completed' when 'cancelled' then 'transport_cancelled' else null end;
    if kind is null then return new; end if;
    title_en:=case new.status when 'pickup_ready' then 'Transport ready for pickup' when 'picked_up' then 'Goods picked up' when 'in_transit' then 'Goods in transit' when 'delivered_pending_confirmation' then 'Delivery awaiting confirmation' when 'completed' then 'Delivery received' when 'cancelled' then 'Transport job cancelled' end;
    body_en:=coalesce(new.status_note,new.cancellation_reason,'The transport job status changed. Open the job timeline for details.');
    title_kn:=case new.status when 'pickup_ready' then 'ಸಾರಿಗೆ ಪಿಕಪ್‌ಗೆ ಸಿದ್ಧವಾಗಿದೆ' when 'picked_up' then 'ಸರಕು ಪಡೆಯಲಾಗಿದೆ' when 'in_transit' then 'ಸರಕು ಸಾಗಣೆಯಲ್ಲಿದೆ' when 'delivered_pending_confirmation' then 'ವಿತರಣೆ ದೃಢೀಕರಣ ಬಾಕಿ' when 'completed' then 'ವಿತರಣೆ ಸ್ವೀಕರಿಸಲಾಗಿದೆ' when 'cancelled' then 'ಸಾರಿಗೆ ಕೆಲಸ ರದ್ದಾಗಿದೆ' end;
    body_kn:='ಸಾರಿಗೆ ಕೆಲಸದ ಸ್ಥಿತಿ ಬದಲಾಗಿದೆ. ವಿವರಗಳಿಗಾಗಿ ಕೆಲಸದ ಇತಿಹಾಸವನ್ನು ನೋಡಿ.';
  end if;
  foreach recipient in array array[new.requester_id,new.transporter_id] loop
    if recipient is not null and (tg_op='INSERT' or recipient<>auth.uid()) then
      insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
      values(recipient,auth.uid(),kind,title_en,body_en,title_kn,body_kn,'transport_jobs',new.id::text);
    end if;
  end loop;
  return new;
end;
$$;
revoke all on function private.notify_transport_job_change() from public,anon,authenticated;
create trigger notify_transport_job_change after insert or update of status on public.transport_jobs for each row execute function private.notify_transport_job_change();

create or replace function private.notify_transport_evidence()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare job public.transport_jobs%rowtype; recipient uuid;
begin
  select * into job from public.transport_jobs where id=new.job_id;
  foreach recipient in array array[job.requester_id,job.transporter_id] loop
    if recipient is not null and recipient<>new.actor_id then
      insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
      values(recipient,new.actor_id,'transport_evidence_added','Transport evidence added','Your transport partner added a delivery or route evidence file.','ಸಾರಿಗೆ ಸಾಕ್ಷ್ಯ ಸೇರಿಸಲಾಗಿದೆ','ನಿಮ್ಮ ಸಾರಿಗೆ ಪಾಲುದಾರರು ವಿತರಣೆ ಅಥವಾ ಮಾರ್ಗದ ಸಾಕ್ಷ್ಯ ಫೈಲ್ ಸೇರಿಸಿದ್ದಾರೆ.','transport_jobs',job.id::text);
    end if;
  end loop;
  return new;
end;
$$;
revoke all on function private.notify_transport_evidence() from public,anon,authenticated;
create trigger notify_transport_evidence after insert on public.transport_job_events for each row when (new.event_type='evidence_added') execute function private.notify_transport_evidence();


-- Enforce participant-role boundaries for commercial offers at the database boundary.
create or replace function private.guard_market_offer_participant_role()
returns trigger language plpgsql set search_path = ''
as $$
declare actor_role text; listing_category text; listing_owner uuid;
begin
  if new.buyer_id is distinct from auth.uid() then raise exception 'Offers must be submitted by the signed-in buyer account'; end if;
  select participant_type into actor_role from public.user_profiles where user_id=new.buyer_id and profile_completed;
  if actor_role is null then raise exception 'Complete your participant profile before submitting offers'; end if;
  select category,owner_id into listing_category,listing_owner from public.market_listings where id=new.listing_id and status='active';
  if listing_category is null then raise exception 'Listing is no longer active'; end if;
  if listing_owner is distinct from new.owner_id or listing_owner=new.buyer_id then raise exception 'Offer owner does not match the active listing'; end if;
  if not (
    (actor_role in ('farmer','fpo_cooperative','fpo') and listing_category in ('produce','machinery','transport'))
    or (actor_role in ('buyer_trader','buyer','machinery_owner','provider') and listing_category in ('produce','transport'))
  ) then
    raise exception 'Your participant role cannot submit an offer for this listing category';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_market_offer_participant_role() from public,anon,authenticated;
drop trigger if exists guard_market_offer_participant_role on public.market_offers;
create trigger guard_market_offer_participant_role before insert on public.market_offers
for each row execute function private.guard_market_offer_participant_role();

-- Listing creation is bound to the participant's immutable account type.
create or replace function private.guard_listing_participant_role()
returns trigger language plpgsql set search_path = ''
as $$
declare actor_role text; profile_ready boolean;
begin
  if new.owner_id is distinct from auth.uid() then raise exception 'Listings must be published by the signed-in owner'; end if;
  select participant_type,profile_completed into actor_role,profile_ready from public.user_profiles where user_id=new.owner_id;
  if not coalesce(profile_ready,false) then raise exception 'Complete your participant profile before publishing a listing'; end if;
  if new.category='produce' then
    if actor_role='fpo_cooperative' and coalesce(current_setting('app.fpo_aggregate_create',true),'off')='on' then return new; end if;
    if actor_role<>'farmer' then raise exception 'Only farmers can publish individual produce listings; FPO lots use member attribution'; end if;
  elsif new.category='machinery' then
    if actor_role<>'machinery_owner' then raise exception 'Only machinery owners can publish machinery services'; end if;
  elsif new.category='byproduct' then
    if actor_role not in ('farmer','fpo_cooperative') then raise exception 'Only farmers and FPOs can publish agricultural by-product listings'; end if;
  elsif new.category='transport' then
    if actor_role<>'transporter' then raise exception 'Only transporters can publish transport services'; end if;
  else
    raise exception 'Unsupported listing category';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_listing_participant_role() from public,anon,authenticated;
drop trigger if exists guard_listing_participant_role on public.market_listings;
create trigger guard_listing_participant_role before insert on public.market_listings
for each row execute function private.guard_listing_participant_role();
