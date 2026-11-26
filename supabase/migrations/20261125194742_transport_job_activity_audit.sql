-- Keep transport lifecycle changes in the central audit trail.
drop trigger if exists audit_transport_jobs on public.transport_jobs;
create trigger audit_transport_jobs
after insert or update on public.transport_jobs
for each row execute function private.write_platform_audit_event();
