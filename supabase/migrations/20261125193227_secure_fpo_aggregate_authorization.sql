-- Replace the caller-settable custom GUC with a private transaction-bound
-- authorization record. The only public entry point remains the validated
-- create_fpo_aggregate_lot RPC.

create table if not exists private.fpo_aggregate_authorizations (
  transaction_id bigint not null,
  actor_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (transaction_id, actor_id)
);
create index if not exists fpo_aggregate_authorizations_created_idx
  on private.fpo_aggregate_authorizations(created_at);
revoke all on private.fpo_aggregate_authorizations from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.authorize_fpo_aggregate_create()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Sign in before creating an FPO lot'; end if;
  if not exists (
    select 1 from public.user_profiles p
    where p.user_id=actor and p.participant_type='fpo_cooperative' and p.profile_completed
  ) then
    raise exception 'A completed FPO or cooperative profile is required';
  end if;
  delete from private.fpo_aggregate_authorizations
  where created_at < now() - interval '1 day';
  insert into private.fpo_aggregate_authorizations(transaction_id,actor_id)
  values(pg_catalog.txid_current(),actor)
  on conflict (transaction_id,actor_id) do nothing;
end;
$$;
revoke all on function private.authorize_fpo_aggregate_create() from public,anon,authenticated;
grant execute on function private.authorize_fpo_aggregate_create() to authenticated;

create or replace function private.clear_fpo_aggregate_authorization()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from private.fpo_aggregate_authorizations
  where transaction_id=pg_catalog.txid_current() and actor_id=auth.uid();
end;
$$;
revoke all on function private.clear_fpo_aggregate_authorization() from public,anon,authenticated;
grant execute on function private.clear_fpo_aggregate_authorization() to authenticated;

create or replace function private.guard_listing_participant_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role text;
  profile_ready boolean;
begin
  if new.owner_id is distinct from auth.uid() then
    raise exception 'Listings must be published by the signed-in owner';
  end if;
  select participant_type,profile_completed
    into actor_role,profile_ready
  from public.user_profiles where user_id=new.owner_id;
  if not coalesce(profile_ready,false) then
    raise exception 'Complete your participant profile before publishing a listing';
  end if;

  if new.category='produce' then
    if actor_role='fpo_cooperative' and exists (
      select 1 from private.fpo_aggregate_authorizations a
      where a.transaction_id=pg_catalog.txid_current() and a.actor_id=new.owner_id
    ) then return new; end if;
    if actor_role<>'farmer' then
      raise exception 'Only farmers can publish individual produce listings; FPO lots use member attribution';
    end if;
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

-- The earlier GUC-based guard is redundant and must not block the new private
-- authorization path.
drop trigger if exists guard_fpo_produce_listing_insert on public.market_listings;
drop function if exists private.guard_fpo_produce_listing();

-- Rebuild the RPC so it authorizes the produce insert inside this transaction,
-- then clears the private record before returning. All RLS checks still apply.
create or replace function public.create_fpo_aggregate_lot(
  p_title text,
  p_description text,
  p_quantity numeric,
  p_unit text,
  p_price_paise bigint,
  p_location text,
  p_quality text,
  p_contributions jsonb
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  new_listing_id uuid;
  total_contributed numeric;
  contribution_count integer;
  distinct_members integer;
  invalid_rows integer;
begin
  if actor is null then raise exception 'Sign in before creating an FPO lot'; end if;
  if not exists (select 1 from public.user_profiles p where p.user_id=actor and p.participant_type='fpo_cooperative' and p.profile_completed) then
    raise exception 'A completed FPO or cooperative profile is required';
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 3 and 120 then raise exception 'Enter a valid lot title'; end if;
  if p_quantity is null or p_quantity<=0 then raise exception 'Lot quantity must be positive'; end if;
  if p_unit not in ('quintal','kg','tonne','lot') then raise exception 'Unsupported produce unit'; end if;
  if p_price_paise is null or p_price_paise<0 then raise exception 'Asking price cannot be negative'; end if;
  if p_location is null or char_length(btrim(p_location)) not between 2 and 120 then raise exception 'Enter a valid pickup location'; end if;
  if jsonb_typeof(p_contributions)<>'array' then raise exception 'Member contributions must be an array'; end if;

  select count(*),count(distinct x.member_id),coalesce(sum(x.quantity),0),
         count(*) filter (where x.member_id is null or x.quantity is null or x.quantity<=0)
    into contribution_count,distinct_members,total_contributed,invalid_rows
  from jsonb_to_recordset(p_contributions) as x(member_id uuid,quantity numeric);
  if contribution_count<1 or contribution_count<>distinct_members or invalid_rows>0 then
    raise exception 'Add at least one valid contribution per distinct active member';
  end if;
  if abs(total_contributed-p_quantity)>0.0005 then
    raise exception 'Member contributions must add up to the aggregate lot quantity';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_contributions) as x(member_id uuid,quantity numeric)
    left join public.fpo_members m on m.id=x.member_id and m.fpo_user_id=actor and m.status='active'
    where m.id is null
  ) then raise exception 'Every contribution must belong to an active member of this FPO'; end if;

  perform private.authorize_fpo_aggregate_create();
  insert into public.market_listings(owner_id,category,title,description,quantity,unit,price_paise,location,quality,status)
  values(actor,'produce',btrim(p_title),nullif(btrim(coalesce(p_description,'')),''),p_quantity,p_unit,p_price_paise,btrim(p_location),nullif(btrim(coalesce(p_quality,'')),''),'active')
  returning id into new_listing_id;

  insert into public.fpo_lot_contributions(listing_id,fpo_user_id,member_id,contributed_quantity)
  select new_listing_id,actor,x.member_id,x.quantity
  from jsonb_to_recordset(p_contributions) as x(member_id uuid,quantity numeric);

  perform private.clear_fpo_aggregate_authorization();
  return new_listing_id;
end;
$$;
revoke all on function public.create_fpo_aggregate_lot(text,text,numeric,text,bigint,text,text,jsonb) from public,anon;
grant execute on function public.create_fpo_aggregate_lot(text,text,numeric,text,bigint,text,text,jsonb) to authenticated;

-- Verified municipality users cannot move the jurisdiction or organisation
-- that an administrator reviewed. Consent remains immutable for all users.
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid()=old.user_id and not public.is_platform_admin() then
    if new.verification_status not in (old.verification_status,'pending') then
      raise exception 'Only platform administrators may verify or reject a participant';
    end if;
    if new.participant_type is distinct from old.participant_type then
      raise exception 'Participant type is fixed at registration; contact support for a correction';
    end if;
    if new.terms_accepted_at is distinct from old.terms_accepted_at
      or new.terms_version is distinct from old.terms_version
      or new.privacy_notice_version is distinct from old.privacy_notice_version then
      raise exception 'Policy consent records are immutable';
    end if;
    if old.participant_type='municipality' and old.verification_status='verified'
      and (
        new.district is distinct from old.district
        or new.taluk is distinct from old.taluk
        or new.organization_name is distinct from old.organization_name
      ) then
      raise exception 'Verified municipality jurisdiction and organisation details can only be changed by a platform administrator';
    end if;
    new.verification_note:=old.verification_note;
  end if;
  new.district:=private.normalize_karnataka_district(new.district);
  new.profile_completed:=
    nullif(btrim(coalesce(new.display_name,'')),'') is not null
    and char_length(btrim(coalesce(new.display_name,'')))>=2
    and nullif(btrim(coalesce(new.phone,'')),'') is not null
    and nullif(btrim(coalesce(new.district,'')),'') is not null
    and nullif(btrim(coalesce(new.taluk,'')),'') is not null
    and nullif(btrim(coalesce(new.village,'')),'') is not null
    and (new.participant_type not in ('municipality','fpo_cooperative') or nullif(btrim(coalesce(new.organization_name,'')),'') is not null);
  new.updated_at:=now();
  return new;
end;
$$;
