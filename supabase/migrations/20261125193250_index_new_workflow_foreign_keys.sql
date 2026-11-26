-- Index foreign-key columns used by member, municipality and transport workflows.
create index if not exists fpo_lot_contributions_member_idx
  on public.fpo_lot_contributions(member_id);
create index if not exists municipality_enquiry_events_actor_idx
  on public.municipality_service_enquiry_events(actor_id);
create index if not exists transport_job_events_actor_idx
  on public.transport_job_events(actor_id);
