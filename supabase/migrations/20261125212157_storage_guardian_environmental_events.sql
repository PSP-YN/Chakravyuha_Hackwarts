-- Preserve the environmental and pest event context alongside every Storage Guardian reading.
alter table public.storage_guardian_readings
  add column if not exists telemetry_context jsonb not null default '{}'::jsonb;

alter table public.storage_guardian_readings
  drop constraint if exists storage_guardian_readings_telemetry_context_object;

alter table public.storage_guardian_readings
  add constraint storage_guardian_readings_telemetry_context_object
  check (jsonb_typeof(telemetry_context) = 'object');

comment on column public.storage_guardian_readings.telemetry_context is
  'Validated rain, roof-ingress, rodent-motion and insect-trap context. Provenance distinguishes browser scenario simulation from physical device sensor telemetry.';
