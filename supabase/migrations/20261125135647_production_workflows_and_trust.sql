create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to postgres;

create or replace function public.is_platform_admin()
returns boolean language sql stable set search_path = ''
as $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false); $$;
revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 2 and 80),
  preferred_language text not null default 'en' check (preferred_language in ('en','kn')),
  participant_type text not null default 'farmer' check (participant_type in ('farmer','buyer','provider','processor','fpo','other')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected')),
  verification_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_profiles enable row level security;
create policy "profiles self read" on public.user_profiles for select to authenticated using (user_id = (select auth.uid()) or public.is_platform_admin());
create policy "profiles self insert" on public.user_profiles for insert to authenticated with check (user_id = (select auth.uid()) and verification_status = 'unverified' and verification_note is null);
create policy "profiles self update" on public.user_profiles for update to authenticated using (user_id = (select auth.uid()) or public.is_platform_admin()) with check (user_id = (select auth.uid()) or public.is_platform_admin());
revoke all on public.user_profiles from anon, authenticated;
grant select, insert, update on public.user_profiles to authenticated;

create or replace function private.guard_profile_update()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() = old.user_id and not public.is_platform_admin() then
    if new.verification_status not in (old.verification_status,'pending') then
      raise exception 'Only platform administrators may verify or reject a participant';
    end if;
    new.verification_note := old.verification_note;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.guard_profile_update() from public, anon, authenticated;
create trigger guard_profile_update before update on public.user_profiles for each row execute function private.guard_profile_update();

create or replace function private.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.user_profiles(user_id,display_name,preferred_language,participant_type)
  values (
    new.id,
    nullif(left(coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',''),80),''),
    case when new.raw_user_meta_data->>'preferred_language' = 'kn' then 'kn' else 'en' end,
    case when new.raw_user_meta_data->>'participant_type' in ('farmer','buyer','provider','processor','fpo','other') then new.raw_user_meta_data->>'participant_type' else 'farmer' end
  ) on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute function private.handle_new_auth_user();
insert into public.user_profiles(user_id) select id from auth.users on conflict (user_id) do nothing;

create table if not exists public.participant_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete restrict,
  listing_id uuid references public.market_listings(id) on delete set null,
  reported_user_id uuid references auth.users(id) on delete set null,
  reason text not null check (reason in ('misleading_listing','fraud_suspicion','harassment','unsafe_practice','spam','other')),
  description text not null check (char_length(description) between 10 and 2000),
  status text not null default 'open' check (status in ('open','in_review','resolved','dismissed')),
  resolution_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (listing_id is not null or reported_user_id is not null),
  check (reported_user_id is null or reported_user_id <> reporter_id)
);
alter table public.participant_reports enable row level security;
create policy "reporter and admin read reports" on public.participant_reports for select to authenticated using (reporter_id = (select auth.uid()) or public.is_platform_admin());
create policy "authenticated users submit reports" on public.participant_reports for insert to authenticated with check (reporter_id = (select auth.uid()) and status = 'open' and reviewed_by is null and resolution_note is null);
create policy "admins manage reports" on public.participant_reports for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
revoke all on public.participant_reports from anon, authenticated;
grant select, insert, update on public.participant_reports to authenticated;

create table if not exists public.market_disputes (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.market_offers(id) on delete restrict,
  opened_by uuid not null references auth.users(id) on delete restrict,
  issue_type text not null check (issue_type in ('quality_mismatch','quantity_mismatch','late_or_missing','machinery_service','payment_disagreement','safety','other')),
  description text not null check (char_length(description) between 10 and 3000),
  status text not null default 'open' check (status in ('open','in_review','resolved','rejected')),
  resolution_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.market_disputes enable row level security;
create policy "dispute parties and admin read" on public.market_disputes for select to authenticated using (
  public.is_platform_admin() or opened_by = (select auth.uid()) or exists (
    select 1 from public.market_offers o where o.id = offer_id and (o.buyer_id = (select auth.uid()) or o.owner_id = (select auth.uid()))
  )
);
create policy "offer parties open disputes" on public.market_disputes for insert to authenticated with check (
  opened_by = (select auth.uid()) and status = 'open' and reviewed_by is null and resolution_note is null
  and exists (select 1 from public.market_offers o where o.id = offer_id and (o.buyer_id = (select auth.uid()) or o.owner_id = (select auth.uid())) and o.status in ('accepted','completed'))
);
create policy "admins manage disputes" on public.market_disputes for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
revoke all on public.market_disputes from anon, authenticated;
grant select, insert, update on public.market_disputes to authenticated;

create table if not exists public.machinery_bookings (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null unique references public.market_offers(id) on delete restrict,
  listing_id uuid not null references public.market_listings(id) on delete restrict,
  requester_id uuid not null references auth.users(id) on delete restrict,
  provider_id uuid not null references auth.users(id) on delete restrict,
  scheduled_start timestamptz not null,
  duration_hours numeric(8,2) not null check (duration_hours > 0),
  status text not null default 'confirmed' check (status in ('confirmed','rescheduled','in_progress','completed','cancelled')),
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> provider_id)
);
alter table public.machinery_bookings enable row level security;
create policy "booking parties read" on public.machinery_bookings for select to authenticated using (requester_id = (select auth.uid()) or provider_id = (select auth.uid()) or public.is_platform_admin());
create policy "booking parties update" on public.machinery_bookings for update to authenticated using (requester_id = (select auth.uid()) or provider_id = (select auth.uid()) or public.is_platform_admin()) with check (requester_id = (select auth.uid()) or provider_id = (select auth.uid()) or public.is_platform_admin());
revoke all on public.machinery_bookings from anon, authenticated;
grant select, update on public.machinery_bookings to authenticated;

create table if not exists public.machinery_booking_events (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.machinery_bookings(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  old_status text,
  new_status text,
  old_start timestamptz,
  new_start timestamptz,
  details text,
  created_at timestamptz not null default now()
);
alter table public.machinery_booking_events enable row level security;
create policy "booking parties read events" on public.machinery_booking_events for select to authenticated using (
  exists (select 1 from public.machinery_bookings b where b.id = booking_id and (b.requester_id = (select auth.uid()) or b.provider_id = (select auth.uid()))) or public.is_platform_admin()
);
revoke all on public.machinery_booking_events from anon, authenticated;
grant select on public.machinery_booking_events to authenticated;

create or replace function private.create_booking_from_accepted_offer()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted'
    and exists (select 1 from public.market_listings l where l.id = new.listing_id and l.category = 'machinery') then
    insert into public.machinery_bookings(offer_id,listing_id,requester_id,provider_id,scheduled_start,duration_hours)
    values (new.id,new.listing_id,new.buyer_id,new.owner_id,new.requested_start_at,new.requested_duration_hours)
    on conflict (offer_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.create_booking_from_accepted_offer() from public, anon, authenticated;
create trigger create_booking_from_accepted_offer after update of status on public.market_offers for each row execute function private.create_booking_from_accepted_offer();

create or replace function private.guard_machinery_booking_insert()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare min_hours numeric; available_from date; available_until date;
begin
  select machinery_min_hours,machinery_available_from,machinery_available_until into min_hours,available_from,available_until
    from public.market_listings where id = new.listing_id and category = 'machinery';
  if not found then raise exception 'Booking must reference a machinery listing'; end if;
  if new.scheduled_start <= now() then raise exception 'Service start must be in the future'; end if;
  if min_hours is not null and new.duration_hours < min_hours then raise exception 'Booking duration is below the listing minimum'; end if;
  if available_from is not null and new.scheduled_start::date < available_from then raise exception 'Booking date is before provider availability'; end if;
  if available_until is not null and (new.scheduled_start + new.duration_hours * interval '1 hour')::date > available_until then raise exception 'Booking exceeds provider availability'; end if;
  perform 1 from auth.users where id = new.provider_id for update;
  if exists (select 1 from public.machinery_bookings b where b.provider_id = new.provider_id and b.status in ('confirmed','rescheduled','in_progress')
    and tstzrange(b.scheduled_start,b.scheduled_start+b.duration_hours*interval '1 hour','[)') && tstzrange(new.scheduled_start,new.scheduled_start+new.duration_hours*interval '1 hour','[)')) then
    raise exception 'Provider already has an overlapping booking';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_machinery_booking_insert() from public, anon, authenticated;
create trigger guard_machinery_booking_insert before insert on public.machinery_bookings for each row execute function private.guard_machinery_booking_insert();

create or replace function private.guard_machinery_booking_update()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare actor uuid := auth.uid(); min_hours numeric; available_from date; available_until date;
begin
  if public.is_platform_admin() then new.updated_at := now(); return new; end if;
  if new.offer_id <> old.offer_id or new.listing_id <> old.listing_id or new.requester_id <> old.requester_id or new.provider_id <> old.provider_id then
    raise exception 'Booking participants and source offer cannot be changed';
  end if;
  if new.status = 'cancelled' then
    if actor not in (old.requester_id,old.provider_id) then raise exception 'Only booking parties may cancel'; end if;
    if old.status not in ('confirmed','rescheduled') then raise exception 'Only confirmed or rescheduled jobs can be cancelled'; end if;
    if char_length(coalesce(new.cancellation_reason,'')) < 5 then raise exception 'Provide a cancellation reason'; end if;
  elsif new.status = 'rescheduled' then
    if actor <> old.provider_id then raise exception 'Only the provider may reschedule'; end if;
    if new.scheduled_start <= now() then raise exception 'Rescheduled start must be in the future'; end if;
  elsif new.status = 'in_progress' then
    if actor <> old.provider_id then raise exception 'Only the provider may start the job'; end if;
  elsif new.status = 'completed' then
    if actor <> old.provider_id or old.status <> 'in_progress' then raise exception 'Only the provider may complete a started job'; end if;
  else raise exception 'Unsupported booking transition';
  end if;
  if old.status in ('completed','cancelled') then raise exception 'Booking is already closed'; end if;
  select machinery_min_hours,machinery_available_from,machinery_available_until into min_hours,available_from,available_until from public.market_listings where id = old.listing_id;
  if new.status = 'rescheduled' then
    if min_hours is not null and new.duration_hours < min_hours then raise exception 'Rescheduled duration is below the listing minimum'; end if;
    if available_from is not null and new.scheduled_start::date < available_from then raise exception 'Rescheduled date is before provider availability'; end if;
    if available_until is not null and (new.scheduled_start + new.duration_hours * interval '1 hour')::date > available_until then raise exception 'Rescheduled booking exceeds provider availability'; end if;
    perform 1 from auth.users where id = new.provider_id for update;
    if exists (select 1 from public.machinery_bookings b where b.id <> old.id and b.provider_id = old.provider_id and b.status in ('confirmed','rescheduled','in_progress')
      and tstzrange(b.scheduled_start,b.scheduled_start+b.duration_hours*interval '1 hour','[)') && tstzrange(new.scheduled_start,new.scheduled_start+new.duration_hours*interval '1 hour','[)')) then
      raise exception 'Provider already has an overlapping booking';
    end if;
  end if;
  new.updated_at := now(); return new;
end;
$$;
revoke all on function private.guard_machinery_booking_update() from public, anon, authenticated;
create trigger guard_machinery_booking_update before update on public.machinery_bookings for each row execute function private.guard_machinery_booking_update();

create or replace function private.log_machinery_booking_event()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.machinery_booking_events(booking_id,actor_id,event_type,old_status,new_status,old_start,new_start,details)
  values (new.id,auth.uid(),
    case when tg_op='INSERT' then 'booking_confirmed' when new.status='rescheduled' then 'booking_rescheduled' when new.status='cancelled' then 'booking_cancelled' when new.status='in_progress' then 'job_started' when new.status='completed' then 'job_completed' else 'booking_updated' end,
    case when tg_op='INSERT' then null else old.status end,new.status,
    case when tg_op='INSERT' then null else old.scheduled_start end,new.scheduled_start,new.cancellation_reason);
  return new;
end;
$$;
revoke all on function private.log_machinery_booking_event() from public, anon, authenticated;
create trigger log_machinery_booking_event after insert or update on public.machinery_bookings for each row execute function private.log_machinery_booking_event();

create table if not exists public.machinery_booking_evidence (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.machinery_bookings(id) on delete restrict,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  evidence_type text not null check (evidence_type in ('before_photo','after_photo','work_note','delivery_note','other')),
  object_path text not null unique,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);
alter table public.machinery_booking_evidence enable row level security;
create policy "booking parties read evidence" on public.machinery_booking_evidence for select to authenticated using (
  exists (select 1 from public.machinery_bookings b where b.id = booking_id and (b.requester_id = (select auth.uid()) or b.provider_id = (select auth.uid()))) or public.is_platform_admin()
);
create policy "booking parties add evidence" on public.machinery_booking_evidence for insert to authenticated with check (
  uploaded_by = (select auth.uid()) and exists (select 1 from public.machinery_bookings b where b.id = booking_id and (b.requester_id = (select auth.uid()) or b.provider_id = (select auth.uid())))
);
revoke all on public.machinery_booking_evidence from anon, authenticated;
grant select, insert on public.machinery_booking_evidence to authenticated;

create table if not exists public.farmloop_processor_acceptances (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listings(id) on delete restrict,
  listing_owner_id uuid not null references auth.users(id) on delete restrict,
  processor_id uuid not null references auth.users(id) on delete restrict,
  proposed_quantity numeric(14,3) not null check (proposed_quantity > 0),
  proposed_price_paise bigint not null check (proposed_price_paise >= 0),
  material_specification text not null check (char_length(material_specification) between 5 and 1000),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','withdrawn')),
  response_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (listing_owner_id <> processor_id)
);
alter table public.farmloop_processor_acceptances enable row level security;
create policy "processor and listing owner read acceptance" on public.farmloop_processor_acceptances for select to authenticated using (processor_id = (select auth.uid()) or listing_owner_id = (select auth.uid()) or public.is_platform_admin());
create policy "processor submits acceptance" on public.farmloop_processor_acceptances for insert to authenticated with check (
  processor_id = (select auth.uid()) and status = 'pending'
  and exists (select 1 from public.market_listings l where l.id = listing_id and l.owner_id = listing_owner_id and l.category = 'byproduct' and l.status = 'active')
);
create policy "parties respond to acceptance" on public.farmloop_processor_acceptances for update to authenticated using (processor_id = (select auth.uid()) or listing_owner_id = (select auth.uid()) or public.is_platform_admin()) with check (processor_id = (select auth.uid()) or listing_owner_id = (select auth.uid()) or public.is_platform_admin());
revoke all on public.farmloop_processor_acceptances from anon, authenticated;
grant select, insert, update on public.farmloop_processor_acceptances to authenticated;

create or replace function private.guard_farmloop_acceptance()
returns trigger language plpgsql set search_path = ''
as $$
declare available_quantity numeric;
begin
  if tg_op='INSERT' then
    if new.status <> 'pending' or new.processor_id <> auth.uid() then raise exception 'New processor requests must be pending and owned by the current user'; end if;
    if not exists (select 1 from public.user_profiles p where p.user_id=auth.uid() and p.participant_type='processor') then raise exception 'Set your participant type to processor before submitting acceptance requests'; end if;
    select quantity into available_quantity from public.market_listings where id=new.listing_id and owner_id=new.listing_owner_id and category='byproduct' and status='active';
    if available_quantity is null or new.proposed_quantity > available_quantity then raise exception 'Proposed quantity exceeds the active by-product listing'; end if;
  else
    if new.listing_id<>old.listing_id or new.listing_owner_id<>old.listing_owner_id or new.processor_id<>old.processor_id or new.proposed_quantity<>old.proposed_quantity or new.proposed_price_paise<>old.proposed_price_paise or new.material_specification<>old.material_specification then raise exception 'Acceptance proposal fields cannot be changed'; end if;
    if auth.uid()=old.listing_owner_id and new.status not in ('accepted','rejected') then raise exception 'Listing owner may accept or reject'; end if;
    if auth.uid()=old.processor_id and new.status<>'withdrawn' then raise exception 'Processor may withdraw a pending request'; end if;
    if old.status<>'pending' then raise exception 'Acceptance request is already decided'; end if;
  end if;
  new.updated_at:=now(); return new;
end;
$$;
revoke all on function private.guard_farmloop_acceptance() from public, anon, authenticated;
create trigger guard_farmloop_acceptance before insert or update on public.farmloop_processor_acceptances for each row execute function private.guard_farmloop_acceptance();

create table if not exists public.material_quality_checks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listings(id) on delete restrict,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  moisture_pct numeric(5,2) check (moisture_pct is null or moisture_pct between 0 and 100),
  contamination_pct numeric(5,2) check (contamination_pct is null or contamination_pct between 0 and 100),
  test_method text not null check (char_length(test_method) between 3 and 300),
  laboratory_name text,
  report_reference text,
  report_object_path text,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  verified_by uuid references auth.users(id) on delete set null,
  verification_note text,
  tested_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.material_quality_checks enable row level security;
create policy "quality checks visible to listing parties" on public.material_quality_checks for select to authenticated using (
  public.is_platform_admin() or submitted_by=(select auth.uid())
  or exists (select 1 from public.market_listings l where l.id=listing_id and l.owner_id=(select auth.uid()))
  or exists (select 1 from public.farmloop_processor_acceptances a where a.listing_id=listing_id and a.processor_id=(select auth.uid()))
);
create policy "listing owner or processor submits quality" on public.material_quality_checks for insert to authenticated with check (
  submitted_by=(select auth.uid()) and verification_status='pending' and verified_by is null
  and (exists (select 1 from public.market_listings l where l.id=listing_id and l.category='byproduct' and l.owner_id=(select auth.uid()))
    or exists (select 1 from public.farmloop_processor_acceptances a where a.listing_id=listing_id and a.processor_id=(select auth.uid()) and a.status='accepted'))
);
create policy "admins verify material quality" on public.material_quality_checks for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
revoke all on public.material_quality_checks from anon, authenticated;
grant select, insert, update on public.material_quality_checks to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('booking-evidence','booking-evidence',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']),
('quality-reports','quality-reports',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "booking parties upload private evidence" on storage.objects for insert to authenticated with check (
  bucket_id='booking-evidence' and (storage.foldername(name))[2]=(select auth.uid()::text)
  and exists (select 1 from public.machinery_bookings b where b.id::text=(storage.foldername(name))[1] and (b.requester_id=(select auth.uid()) or b.provider_id=(select auth.uid())))
);
create policy "booking parties read private evidence" on storage.objects for select to authenticated using (
  bucket_id='booking-evidence' and exists (select 1 from public.machinery_bookings b where b.id::text=(storage.foldername(name))[1] and (b.requester_id=(select auth.uid()) or b.provider_id=(select auth.uid())))
);
create policy "quality parties upload reports" on storage.objects for insert to authenticated with check (
  bucket_id='quality-reports' and (storage.foldername(name))[2]=(select auth.uid()::text)
  and (exists (select 1 from public.market_listings l where l.id::text=(storage.foldername(name))[1] and l.owner_id=(select auth.uid()) and l.category='byproduct')
    or exists (select 1 from public.farmloop_processor_acceptances a where a.listing_id::text=(storage.foldername(name))[1] and a.processor_id=(select auth.uid()) and a.status='accepted'))
);
create policy "quality parties read reports" on storage.objects for select to authenticated using (
  bucket_id='quality-reports' and (exists (select 1 from public.market_listings l where l.id::text=(storage.foldername(name))[1] and l.owner_id=(select auth.uid()) and l.category='byproduct')
    or exists (select 1 from public.farmloop_processor_acceptances a where a.listing_id::text=(storage.foldername(name))[1] and a.processor_id=(select auth.uid()))
    or public.is_platform_admin())
);

create index if not exists user_profiles_participant_type_idx on public.user_profiles(participant_type);
create index if not exists reports_reporter_idx on public.participant_reports(reporter_id,created_at desc);
create index if not exists reports_listing_idx on public.participant_reports(listing_id) where listing_id is not null;
create index if not exists reports_reported_user_idx on public.participant_reports(reported_user_id) where reported_user_id is not null;
create index if not exists reports_reviewer_idx on public.participant_reports(reviewed_by) where reviewed_by is not null;
create index if not exists disputes_offer_idx on public.market_disputes(offer_id);
create index if not exists disputes_opened_by_idx on public.market_disputes(opened_by,created_at desc);
create index if not exists disputes_reviewer_idx on public.market_disputes(reviewed_by) where reviewed_by is not null;
create index if not exists bookings_listing_idx on public.machinery_bookings(listing_id,scheduled_start);
create index if not exists bookings_provider_window_idx on public.machinery_bookings(provider_id,scheduled_start) where status in ('confirmed','rescheduled','in_progress');
create index if not exists bookings_requester_idx on public.machinery_bookings(requester_id,created_at desc);
create index if not exists booking_events_booking_idx on public.machinery_booking_events(booking_id,created_at desc);
create index if not exists booking_events_actor_idx on public.machinery_booking_events(actor_id) where actor_id is not null;
create index if not exists booking_evidence_booking_idx on public.machinery_booking_evidence(booking_id,created_at desc);
create index if not exists booking_evidence_uploader_idx on public.machinery_booking_evidence(uploaded_by);
create index if not exists acceptances_listing_idx on public.farmloop_processor_acceptances(listing_id,created_at desc);
create index if not exists acceptances_owner_idx on public.farmloop_processor_acceptances(listing_owner_id,status);
create index if not exists acceptances_processor_idx on public.farmloop_processor_acceptances(processor_id,status);
create index if not exists quality_listing_idx on public.material_quality_checks(listing_id,created_at desc);
create index if not exists quality_submitter_idx on public.material_quality_checks(submitted_by);
create index if not exists quality_verifier_idx on public.material_quality_checks(verified_by) where verified_by is not null;

create or replace function public.guard_offer_status_transition()
returns trigger language plpgsql set search_path = ''
as $$
declare
 listing_qty numeric(14,3);
 listing_status text;
 listing_category text;
 available_from date;
 available_until date;
 reserved_qty numeric(14,3);
begin
 if new.status = old.status then return new; end if;
 if old.status = 'pending' and new.status in ('accepted','rejected','withdrawn') then
   if new.status = 'withdrawn' and old.buyer_id <> (select auth.uid()) then raise exception 'Only the buyer can withdraw a pending offer'; end if;
   if new.status in ('accepted','rejected') and old.owner_id <> (select auth.uid()) then raise exception 'Only the seller can decide a pending offer'; end if;
   if new.status = 'accepted' then
     select l.quantity,l.status,l.category,l.machinery_available_from,l.machinery_available_until
       into listing_qty,listing_status,listing_category,available_from,available_until
       from public.market_listings l where l.id=old.listing_id for update;
     if listing_status <> 'active' then raise exception 'Only active listings can have offers accepted'; end if;
     select coalesce(sum(o.accepted_quantity),0) into reserved_qty from public.market_offers o
       where o.listing_id=old.listing_id and o.id<>old.id and o.status in ('accepted','completed')
       and not exists (select 1 from public.machinery_bookings b where b.offer_id=o.id and b.status='cancelled');
     if reserved_qty+new.accepted_quantity>listing_qty then raise exception 'Accepted offers cannot exceed the listing quantity'; end if;
     if listing_category='machinery' then
       if new.requested_start_at is null or new.requested_duration_hours is null then raise exception 'Machinery offers require a requested start time and duration'; end if;
       if available_from is not null and new.requested_start_at::date<available_from then raise exception 'Requested date is before the service availability window'; end if;
       if available_until is not null and (new.requested_start_at+(new.requested_duration_hours * interval '1 hour'))::date>available_until then raise exception 'Requested service extends beyond the availability window'; end if;
       if exists (
         select 1 from public.market_offers o left join public.machinery_bookings b on b.offer_id=o.id
         where o.listing_id=old.listing_id and o.id<>old.id and o.status in ('accepted','completed')
           and (b.id is null or b.status<>'cancelled')
           and o.requested_start_at is not null and o.requested_duration_hours is not null
           and o.requested_start_at<new.requested_start_at+(new.requested_duration_hours * interval '1 hour')
           and o.requested_start_at+(o.requested_duration_hours * interval '1 hour')>new.requested_start_at
       ) then raise exception 'This machinery service time overlaps an accepted booking'; end if;
     end if;
   end if;
   return new;
 end if;
 if old.status='accepted' and new.status='completed' and old.owner_id=(select auth.uid()) then return new; end if;
 raise exception 'Invalid offer status transition';
end;
$$;

alter table public.market_offers drop constraint if exists market_offers_status_check;
alter table public.market_offers add constraint market_offers_status_check
  check (status = any (array['pending','accepted','rejected','withdrawn','completed','cancelled']::text[]));

create or replace function public.guard_offer_status_transition()
returns trigger language plpgsql set search_path = ''
as $$
declare listing_qty numeric(14,3); listing_status text; listing_category text;
available_from date; available_until date; reserved_qty numeric(14,3);
begin
 if new.status = old.status then return new; end if;
 if old.status = 'pending' and new.status in ('accepted','rejected','withdrawn') then
   if new.status = 'withdrawn' and old.buyer_id <> (select auth.uid()) then raise exception 'Only the buyer can withdraw a pending offer'; end if;
   if new.status in ('accepted','rejected') and old.owner_id <> (select auth.uid()) then raise exception 'Only the seller can decide a pending offer'; end if;
   if new.status = 'accepted' then
     select l.quantity,l.status,l.category,l.machinery_available_from,l.machinery_available_until
       into listing_qty,listing_status,listing_category,available_from,available_until
       from public.market_listings l where l.id=old.listing_id for update;
     if listing_status <> 'active' then raise exception 'Only active listings can have offers accepted'; end if;
     select coalesce(sum(o.accepted_quantity),0) into reserved_qty from public.market_offers o
       where o.listing_id=old.listing_id and o.id<>old.id and o.status in ('accepted','completed')
       and not exists (select 1 from public.machinery_bookings b where b.offer_id=o.id and b.status='cancelled');
     if reserved_qty+new.accepted_quantity>listing_qty then raise exception 'Accepted offers cannot exceed the listing quantity'; end if;
     if listing_category='machinery' then
       if new.requested_start_at is null or new.requested_duration_hours is null then raise exception 'Machinery offers require a requested start time and duration'; end if;
       if available_from is not null and new.requested_start_at::date<available_from then raise exception 'Requested date is before the service availability window'; end if;
       if available_until is not null and (new.requested_start_at+(new.requested_duration_hours*interval '1 hour'))::date>available_until then raise exception 'Requested service extends beyond the availability window'; end if;
       if exists (
         select 1 from public.market_offers o left join public.machinery_bookings b on b.offer_id=o.id
         where o.listing_id=old.listing_id and o.id<>old.id and o.status in ('accepted','completed')
           and (b.id is null or b.status<>'cancelled')
           and o.requested_start_at is not null and o.requested_duration_hours is not null
           and o.requested_start_at<new.requested_start_at+(new.requested_duration_hours*interval '1 hour')
           and o.requested_start_at+(o.requested_duration_hours*interval '1 hour')>new.requested_start_at
       ) then raise exception 'This machinery service time overlaps an accepted booking'; end if;
     end if;
   end if;
   return new;
 end if;
 if old.status='accepted' and new.status='completed' and (old.owner_id=(select auth.uid()) or public.is_platform_admin()) then return new; end if;
 if old.status='accepted' and new.status='cancelled' and (
   public.is_platform_admin()
   or exists(select 1 from public.machinery_bookings b where b.offer_id=old.id and b.status='cancelled'
     and (b.requester_id=(select auth.uid()) or b.provider_id=(select auth.uid())))
 ) then return new; end if;
 raise exception 'Invalid offer status transition';
end;
$$;

create or replace function private.sync_booking_status_to_offer()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status in ('completed','cancelled') and old.status is distinct from new.status then
    update public.market_offers set status = new.status where id = new.offer_id and status = 'accepted';
  end if;
  return new;
end;
$$;
revoke all on function private.sync_booking_status_to_offer() from public, anon, authenticated;
create trigger sync_booking_status_to_offer after update of status on public.machinery_bookings for each row execute function private.sync_booking_status_to_offer();

drop policy if exists "booking parties read private evidence" on storage.objects;
create policy "booking parties read private evidence" on storage.objects for select to authenticated using (
  bucket_id='booking-evidence' and (
    exists (select 1 from public.machinery_bookings b where b.id::text=(storage.foldername(name))[1] and (b.requester_id=(select auth.uid()) or b.provider_id=(select auth.uid())))
    or public.is_platform_admin()
  )
);
