-- Keep the moderation RPC invoker-scoped. Admin RLS and column-level grants
-- authorize the status change and audit insert; no exposed SECURITY DEFINER RPC.
revoke update on public.market_listings from authenticated;
grant update(status) on public.market_listings to authenticated;

drop policy if exists "admins update listings" on public.market_listings;
create policy "admins update listings"
on public.market_listings for update to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

grant insert on public.listing_moderation_actions to authenticated;
drop policy if exists "admins insert listing moderation history" on public.listing_moderation_actions;
create policy "admins insert listing moderation history"
on public.listing_moderation_actions for insert to authenticated
with check (public.is_platform_admin());

create or replace function public.admin_moderate_listing(
  p_listing_id uuid,
  p_status text,
  p_reason text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare previous text;
begin
  if not public.is_platform_admin() then
    raise exception 'Only platform administrators may moderate listings';
  end if;
  if p_status is null or p_status not in ('active','paused','closed') then
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
