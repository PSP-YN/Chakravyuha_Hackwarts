-- Store immutable, versioned policy acceptance records for each account.
create table if not exists public.user_policy_acceptances (
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null check(char_length(terms_version) between 1 and 40),
  privacy_notice_version text not null check(char_length(privacy_notice_version) between 1 and 40),
  accepted_at timestamptz not null default now(),
  primary key(user_id,terms_version,privacy_notice_version)
);

alter table public.user_policy_acceptances enable row level security;
revoke all on public.user_policy_acceptances from public, anon, authenticated;
grant select on public.user_policy_acceptances to authenticated;

drop policy if exists "participants read own policy acceptances" on public.user_policy_acceptances;
create policy "participants read own policy acceptances"
on public.user_policy_acceptances for select to authenticated
using(user_id=(select auth.uid()));

create or replace function private.record_policy_acceptance()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.terms_accepted_at is not null
   and new.terms_version is not null
   and new.privacy_notice_version is not null
   and (
     tg_op='INSERT'
     or new.terms_version is distinct from old.terms_version
     or new.privacy_notice_version is distinct from old.privacy_notice_version
     or new.terms_accepted_at is distinct from old.terms_accepted_at
   ) then
   insert into public.user_policy_acceptances(user_id,terms_version,privacy_notice_version,accepted_at)
   values(new.user_id,new.terms_version,new.privacy_notice_version,new.terms_accepted_at)
   on conflict(user_id,terms_version,privacy_notice_version) do nothing;
 end if;
 return new;
end;
$$;

drop trigger if exists record_policy_acceptance on public.user_profiles;
create trigger record_policy_acceptance
after insert or update of terms_accepted_at,terms_version,privacy_notice_version
on public.user_profiles
for each row execute function private.record_policy_acceptance();
