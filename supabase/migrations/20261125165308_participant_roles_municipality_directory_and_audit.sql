alter table public.user_profiles drop constraint if exists user_profiles_participant_type_check;
alter table public.user_profiles add constraint user_profiles_participant_type_check
check (participant_type = any (array[
  'farmer','buyer','provider','processor','fpo','other',
  'buyer_trader','machinery_owner','waste_processor','municipality','transporter','fpo_cooperative'
]::text[]));

create table if not exists public.municipality_contacts (
  id uuid primary key default gen_random_uuid(),
  district text not null check (char_length(district) between 2 and 80),
  taluk text,
  jurisdiction text not null check (char_length(jurisdiction) between 2 and 160),
  office_name text not null check (char_length(office_name) between 2 and 160),
  contact_person text,
  phone text,
  email text,
  address text,
  services text[] not null default '{}',
  source_url text not null check (source_url ~ '^https?://'),
  verified_at date,
  verified_by uuid references auth.users(id) on delete set null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.municipality_contacts enable row level security;
drop policy if exists "public reads active municipality contacts" on public.municipality_contacts;
create policy "public reads active municipality contacts" on public.municipality_contacts
for select to anon, authenticated using (is_active = true);
drop policy if exists "admins manage municipality contacts" on public.municipality_contacts;
create policy "admins manage municipality contacts" on public.municipality_contacts
for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
revoke all on public.municipality_contacts from anon, authenticated;
grant select on public.municipality_contacts to anon, authenticated;
grant insert, update, delete on public.municipality_contacts to authenticated;

create index if not exists municipality_contacts_location_idx
on public.municipality_contacts(district, taluk) where is_active = true;

create table if not exists public.platform_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  table_name text not null,
  record_id text,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  changed_fields text[] not null default '{}',
  occurred_at timestamptz not null default now()
);
alter table public.platform_audit_events enable row level security;
drop policy if exists "participants read own audit events" on public.platform_audit_events;
create policy "participants read own audit events" on public.platform_audit_events
for select to authenticated using (actor_id = (select auth.uid()) or public.is_platform_admin());
revoke all on public.platform_audit_events from anon, authenticated;
grant select on public.platform_audit_events to authenticated;

create or replace function private.write_platform_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_data jsonb;
  new_data jsonb;
  row_data jsonb;
  changed text[];
  record_key text;
begin
  if tg_op = 'INSERT' then
    new_data := to_jsonb(new);
    row_data := new_data;
    select coalesce(array_agg(k order by k), '{}') into changed from jsonb_object_keys(new_data) as k
      where k not in ('created_at','updated_at');
  elsif tg_op = 'UPDATE' then
    old_data := to_jsonb(old);
    new_data := to_jsonb(new);
    row_data := new_data;
    select coalesce(array_agg(n.key order by n.key), '{}') into changed
      from jsonb_each(new_data) n
      join jsonb_each(old_data) o on o.key=n.key
      where n.value is distinct from o.value and n.key not in ('updated_at');
  else
    old_data := to_jsonb(old);
    row_data := old_data;
    select coalesce(array_agg(k order by k), '{}') into changed from jsonb_object_keys(old_data) as k
      where k not in ('created_at','updated_at');
  end if;
  record_key := coalesce(row_data->>'id', row_data->>'user_id');
  insert into public.platform_audit_events(actor_id,table_name,record_id,action,changed_fields)
  values (auth.uid(),tg_table_name,record_key,tg_op,changed);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.write_platform_audit_event() from public, anon, authenticated;

drop trigger if exists audit_user_profiles on public.user_profiles;
create trigger audit_user_profiles after insert or update or delete on public.user_profiles
for each row execute function private.write_platform_audit_event();
drop trigger if exists audit_market_listings on public.market_listings;
create trigger audit_market_listings after insert or update or delete on public.market_listings
for each row execute function private.write_platform_audit_event();
drop trigger if exists audit_market_offers on public.market_offers;
create trigger audit_market_offers after insert or update or delete on public.market_offers
for each row execute function private.write_platform_audit_event();
drop trigger if exists audit_machinery_bookings on public.machinery_bookings;
create trigger audit_machinery_bookings after insert or update or delete on public.machinery_bookings
for each row execute function private.write_platform_audit_event();
drop trigger if exists audit_farmloop_acceptances on public.farmloop_processor_acceptances;
create trigger audit_farmloop_acceptances after insert or update or delete on public.farmloop_processor_acceptances
for each row execute function private.write_platform_audit_event();
drop trigger if exists audit_municipality_contacts on public.municipality_contacts;
create trigger audit_municipality_contacts after insert or update or delete on public.municipality_contacts
for each row execute function private.write_platform_audit_event();

insert into public.municipality_contacts (district,taluk,jurisdiction,office_name,address,services,source_url,verified_at,is_active)
values ('Tumakuru','Tumakuru','Tumakuru City Corporation jurisdiction','Tumakuru City Corporation','Townhall, Mahaveer Vacant Road, Gandhi Nagar, Tumakuru, Karnataka 572102, India',array['Municipal office enquiries'],'https://tumkur.nic.in/en/public-utility/tumkur-city-corporation/','2026-11-25',true);
