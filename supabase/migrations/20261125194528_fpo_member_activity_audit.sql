-- Keep the member registry and contribution ledger in the platform audit trail.
drop trigger if exists audit_fpo_members on public.fpo_members;
create trigger audit_fpo_members
after insert or update on public.fpo_members
for each row execute function private.write_platform_audit_event();

drop trigger if exists audit_fpo_lot_contributions on public.fpo_lot_contributions;
create trigger audit_fpo_lot_contributions
after insert on public.fpo_lot_contributions
for each row execute function private.write_platform_audit_event();
