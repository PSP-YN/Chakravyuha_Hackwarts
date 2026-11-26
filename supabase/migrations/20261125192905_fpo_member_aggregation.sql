-- FPO member registry and auditable member-level quantity attribution.
create table if not exists public.fpo_members (
  id uuid primary key default gen_random_uuid(),
  fpo_user_id uuid not null references auth.users(id) on delete cascade,
  member_name text not null check (char_length(btrim(member_name)) between 2 and 120),
  member_phone text check (member_phone is null or char_length(btrim(member_phone)) between 7 and 20),
  village text not null check (char_length(btrim(village)) between 2 and 100),
  district text not null check (char_length(btrim(district)) between 2 and 80),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists fpo_members_owner_idx on public.fpo_members(fpo_user_id,status,member_name);
alter table public.fpo_members enable row level security;
create policy "FPOs read own members" on public.fpo_members for select to authenticated
  using (fpo_user_id = (select auth.uid()));
create policy "FPOs add own members" on public.fpo_members for insert to authenticated
  with check (fpo_user_id = (select auth.uid()) and exists (
    select 1 from public.user_profiles p where p.user_id = (select auth.uid()) and p.participant_type = 'fpo_cooperative' and p.profile_completed
  ));
create policy "FPOs update own members" on public.fpo_members for update to authenticated
  using (fpo_user_id = (select auth.uid()))
  with check (fpo_user_id = (select auth.uid()) and exists (
    select 1 from public.user_profiles p where p.user_id = (select auth.uid()) and p.participant_type = 'fpo_cooperative' and p.profile_completed
  ));
revoke all on public.fpo_members from anon,authenticated;
grant select,insert,update on public.fpo_members to authenticated;
create trigger fpo_members_updated_at before update on public.fpo_members
  for each row execute function public.set_updated_at();

create table if not exists public.fpo_lot_contributions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listings(id) on delete restrict,
  fpo_user_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid not null references public.fpo_members(id) on delete restrict,
  member_name_snapshot text not null,
  village_snapshot text not null,
  district_snapshot text not null,
  contributed_quantity numeric(14,3) not null check (contributed_quantity > 0),
  created_at timestamptz not null default now(),
  unique (listing_id,member_id)
);
create index if not exists fpo_lot_contributions_listing_idx on public.fpo_lot_contributions(listing_id);
create index if not exists fpo_lot_contributions_owner_idx on public.fpo_lot_contributions(fpo_user_id,created_at desc);
alter table public.fpo_lot_contributions enable row level security;
create policy "FPOs read own lot contributions" on public.fpo_lot_contributions for select to authenticated
  using (fpo_user_id = (select auth.uid()));
create policy "FPOs attribute own aggregate lots" on public.fpo_lot_contributions for insert to authenticated
  with check (
    fpo_user_id = (select auth.uid())
    and exists (select 1 from public.fpo_members m where m.id = member_id and m.fpo_user_id = (select auth.uid()) and m.status = 'active')
    and exists (select 1 from public.market_listings l where l.id = listing_id and l.owner_id = (select auth.uid()) and l.category = 'produce')
  );
revoke all on public.fpo_lot_contributions from anon,authenticated;
grant select,insert on public.fpo_lot_contributions to authenticated;

-- Create the public produce lot and its member-level quantity ledger atomically.
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
  if not exists (select 1 from public.user_profiles p where p.user_id = actor and p.participant_type = 'fpo_cooperative' and p.profile_completed) then
    raise exception 'A completed FPO or cooperative profile is required';
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 3 and 120 then raise exception 'Enter a valid lot title'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Lot quantity must be positive'; end if;
  if p_unit not in ('quintal','kg','tonne','lot') then raise exception 'Unsupported produce unit'; end if;
  if p_price_paise is null or p_price_paise < 0 then raise exception 'Asking price cannot be negative'; end if;
  if p_location is null or char_length(btrim(p_location)) not between 2 and 120 then raise exception 'Enter a valid pickup location'; end if;
  if jsonb_typeof(p_contributions) <> 'array' then raise exception 'Member contributions must be an array'; end if;

  select count(*),count(distinct x.member_id),coalesce(sum(x.quantity),0),count(*) filter (where x.member_id is null or x.quantity is null or x.quantity <= 0)
    into contribution_count,distinct_members,total_contributed,invalid_rows
  from jsonb_to_recordset(p_contributions) as x(member_id uuid,quantity numeric);
  if contribution_count < 1 or contribution_count <> distinct_members or invalid_rows > 0 then
    raise exception 'Add at least one valid contribution per distinct active member';
  end if;
  if abs(total_contributed - p_quantity) > 0.0005 then
    raise exception 'Member contributions must add up to the aggregate lot quantity';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_contributions) as x(member_id uuid,quantity numeric)
    left join public.fpo_members m on m.id=x.member_id and m.fpo_user_id=actor and m.status='active'
    where m.id is null
  ) then raise exception 'Every contribution must belong to an active member of this FPO'; end if;

  perform set_config('app.fpo_aggregate_create','on',true);
  insert into public.market_listings(owner_id,category,title,description,quantity,unit,price_paise,location,quality,status)
  values (actor,'produce',btrim(p_title),nullif(btrim(coalesce(p_description,'')),''),p_quantity,p_unit,p_price_paise,btrim(p_location),nullif(btrim(coalesce(p_quality,'')),''),'active')
  returning id into new_listing_id;
  perform set_config('app.fpo_aggregate_create','off',true);

  insert into public.fpo_lot_contributions(listing_id,fpo_user_id,member_id,contributed_quantity)
  select new_listing_id,actor,x.member_id,x.quantity
  from jsonb_to_recordset(p_contributions) as x(member_id uuid,quantity numeric);

  return new_listing_id;
end;
$$;
revoke all on function public.create_fpo_aggregate_lot(text,text,numeric,text,bigint,text,text,jsonb) from public,anon;
grant execute on function public.create_fpo_aggregate_lot(text,text,numeric,text,bigint,text,text,jsonb) to authenticated;


create or replace function private.guard_fpo_produce_listing()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.category='produce' and exists (select 1 from public.user_profiles p where p.user_id=new.owner_id and p.participant_type='fpo_cooperative')
    and coalesce(current_setting('app.fpo_aggregate_create',true),'off')<>'on' then
    raise exception 'FPO produce lots must be published through the member-attributed aggregate workflow';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_fpo_produce_listing() from public,anon,authenticated;
create trigger guard_fpo_produce_listing_insert before insert on public.market_listings for each row execute function private.guard_fpo_produce_listing();

create or replace function private.guard_fpo_contribution_total()
returns trigger language plpgsql set search_path = ''
as $$
declare listing_owner uuid; listing_quantity numeric; listing_category text; member_owner uuid; member_status text; member_name_value text; member_village_value text; member_district_value text; current_total numeric;
begin
  select owner_id,quantity,category into listing_owner,listing_quantity,listing_category from public.market_listings where id=new.listing_id for update;
  select fpo_user_id,status,member_name,village,district into member_owner,member_status,member_name_value,member_village_value,member_district_value from public.fpo_members where id=new.member_id;
  if listing_owner is distinct from new.fpo_user_id or listing_category<>'produce' then raise exception 'Member contributions must reference the FPO own produce lot'; end if;
  if member_owner is distinct from new.fpo_user_id or member_status<>'active' then raise exception 'Contribution member must be active and belong to the FPO'; end if;
  new.member_name_snapshot:=member_name_value;new.village_snapshot:=member_village_value;new.district_snapshot:=member_district_value;
  select coalesce(sum(contributed_quantity),0) into current_total from public.fpo_lot_contributions where listing_id=new.listing_id;
  if current_total+new.contributed_quantity>listing_quantity+0.0005 then raise exception 'Member contributions exceed the aggregate lot quantity'; end if;
  return new;
end;
$$;
revoke all on function private.guard_fpo_contribution_total() from public,anon,authenticated;
create trigger guard_fpo_contribution_total before insert on public.fpo_lot_contributions for each row execute function private.guard_fpo_contribution_total();

create or replace function private.guard_fpo_listing_quantity_update()
returns trigger language plpgsql set search_path = ''
as $$
declare attributed numeric;
begin
  if exists (select 1 from public.fpo_lot_contributions c where c.listing_id=old.id) then
    select coalesce(sum(c.contributed_quantity),0) into attributed from public.fpo_lot_contributions c where c.listing_id=old.id;
    if new.category<>'produce' or new.owner_id<>old.owner_id or abs(new.quantity-attributed)>0.0005 then
      raise exception 'FPO aggregate lot quantity and owner must remain consistent with the immutable member attribution ledger';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_fpo_listing_quantity_update() from public,anon,authenticated;
create trigger guard_fpo_listing_quantity_update before update of quantity,category,owner_id on public.market_listings for each row execute function private.guard_fpo_listing_quantity_update();
