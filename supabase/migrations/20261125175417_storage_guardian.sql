-- KRISHI GUARD: owner-scoped storage monitoring with device-only ingestion credentials.
create table if not exists public.storage_guardian_devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  device_code text not null unique check (char_length(device_code) between 6 and 32),
  device_name text not null check (char_length(device_name) between 2 and 80),
  crop_type text not null default 'mixed' check (crop_type in ('paddy','ragi','maize','wheat','mixed','other')),
  storage_type text not null default 'bag' check (storage_type in ('bag','bin','silo','room','other')),
  location text not null check (char_length(location) between 2 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.storage_guardian_readings (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.storage_guardian_devices(id) on delete cascade,
  ambient_temperature_c numeric(5,2) not null check (ambient_temperature_c between -10 and 70),
  relative_humidity_pct numeric(5,2) not null check (relative_humidity_pct between 0 and 100),
  grain_temperature_c numeric(5,2) not null check (grain_temperature_c between -10 and 80),
  temperature_delta_c numeric(5,2) not null,
  condition_score smallint not null check (condition_score between 0 and 100),
  condition_level text not null check (condition_level in ('NORMAL','WATCH','ACTION','URGENT')),
  reasons text[] not null default '{}',
  battery_voltage numeric(5,2) check (battery_voltage is null or battery_voltage between 0 and 30),
  source text not null default 'device' check (source in ('device','simulator')),
  recorded_at timestamptz not null default now()
);

create table if not exists public.storage_guardian_device_keys (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null unique references public.storage_guardian_devices(id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) = 64),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists storage_guardian_devices_owner_idx
  on public.storage_guardian_devices(owner_id, created_at desc);
create index if not exists storage_guardian_readings_device_time_idx
  on public.storage_guardian_readings(device_id, recorded_at desc);
create index if not exists storage_guardian_keys_active_idx
  on public.storage_guardian_device_keys(token_hash) where revoked_at is null;

alter table public.storage_guardian_devices enable row level security;
alter table public.storage_guardian_readings enable row level security;
alter table public.storage_guardian_device_keys enable row level security;

drop policy if exists "owners read storage guardian devices" on public.storage_guardian_devices;
create policy "owners read storage guardian devices"
  on public.storage_guardian_devices for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "owners update storage guardian devices" on public.storage_guardian_devices;
create policy "owners update storage guardian devices"
  on public.storage_guardian_devices for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "owners read storage guardian readings" on public.storage_guardian_readings;
create policy "owners read storage guardian readings"
  on public.storage_guardian_readings for select to authenticated
  using (exists (
    select 1 from public.storage_guardian_devices d
    where d.id = storage_guardian_readings.device_id
      and d.owner_id = (select auth.uid())
  ));

-- Device credentials are never exposed to browser roles. Only the Edge Function's service role can read or rotate them.
revoke all on public.storage_guardian_device_keys from anon, authenticated;
grant all on public.storage_guardian_device_keys to service_role;
grant select on public.storage_guardian_devices, public.storage_guardian_readings to authenticated;
grant update(device_name, location, is_active) on public.storage_guardian_devices to authenticated;

comment on table public.storage_guardian_devices is 'Owner-scoped KRISHI GUARD storage monitoring devices. No raw device credentials are stored here.';
comment on table public.storage_guardian_readings is 'Timestamped storage microclimate readings and transparent prototype condition indicators.';
comment on table public.storage_guardian_device_keys is 'Hashed device credentials; access restricted to the Supabase service role.';
comment on column public.storage_guardian_readings.condition_score is 'Heuristic storage-condition score, not a probability of spoilage or a grain moisture measurement.';

revoke all on public.storage_guardian_devices, public.storage_guardian_readings from anon;
grant all on public.storage_guardian_devices, public.storage_guardian_readings, public.storage_guardian_device_keys to service_role;
grant usage, select on sequence public.storage_guardian_readings_id_seq to service_role;
create policy "device keys deny browser roles" on public.storage_guardian_device_keys
  for all to anon, authenticated using (false) with check (false);
