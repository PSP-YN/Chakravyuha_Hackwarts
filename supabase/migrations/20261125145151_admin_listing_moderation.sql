create table if not exists public.listing_moderation_actions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listings(id) on delete restrict,
  admin_id uuid not null references auth.users(id) on delete restrict,
  previous_status text not null check (previous_status in ('active','paused','closed')),
  new_status text not null check (new_status in ('active','paused','closed')),
  reason text not null check (char_length(reason) between 10 and 1000),
  created_at timestamptz not null default now()
);
alter table public.listing_moderation_actions enable row level security;
drop policy if exists "admins read listing moderation history" on public.listing_moderation_actions;
create policy "admins read listing moderation history"
on public.listing_moderation_actions for select to authenticated
using (public.is_platform_admin());
revoke all on public.listing_moderation_actions from anon, authenticated;
grant select on public.listing_moderation_actions to authenticated;

drop policy if exists "admins discover all listings" on public.market_listings;
create policy "admins discover all listings"
on public.market_listings for select to authenticated
using (public.is_platform_admin());

create or replace function public.admin_moderate_listing(
  p_listing_id uuid,
  p_status text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare previous text;
begin
  if not public.is_platform_admin() then
    raise exception 'Only platform administrators may moderate listings';
  end if;
  if p_status not in ('active','paused','closed') then
    raise exception 'Unsupported listing moderation status';
  end if;
  if char_length(trim(coalesce(p_reason,''))) < 10 or char_length(p_reason) > 1000 then
    raise exception 'Provide a moderation reason between 10 and 1000 characters';
  end if;
  select status into previous
    from public.market_listings
    where id = p_listing_id
    for update;
  if not found then raise exception 'Listing not found'; end if;
  if previous = p_status then raise exception 'Listing already has that status'; end if;
  update public.market_listings set status = p_status where id = p_listing_id;
  insert into public.listing_moderation_actions(listing_id,admin_id,previous_status,new_status,reason)
  values (p_listing_id,(select auth.uid()),previous,p_status,trim(p_reason));
end;
$$;
revoke all on function public.admin_moderate_listing(uuid,text,text) from public, anon, authenticated;
grant execute on function public.admin_moderate_listing(uuid,text,text) to authenticated;
