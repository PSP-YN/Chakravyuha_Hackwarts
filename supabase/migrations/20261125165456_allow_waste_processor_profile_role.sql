create or replace function private.guard_farmloop_acceptance()
returns trigger language plpgsql set search_path = ''
as $$
declare available_quantity numeric;
begin
  if tg_op='INSERT' then
    if new.status <> 'pending' or new.processor_id <> auth.uid() then
      raise exception 'New processor requests must be pending and owned by the current user';
    end if;
    if not exists (
      select 1 from public.user_profiles p
      where p.user_id=auth.uid() and p.participant_type in ('processor','waste_processor')
    ) then
      raise exception 'Set your participant type to waste processor before submitting acceptance requests';
    end if;
    select quantity into available_quantity
    from public.market_listings
    where id=new.listing_id and owner_id=new.listing_owner_id and category='byproduct' and status='active';
    if available_quantity is null or new.proposed_quantity > available_quantity then
      raise exception 'Proposed quantity exceeds the active by-product listing';
    end if;
  else
    if new.listing_id<>old.listing_id or new.listing_owner_id<>old.listing_owner_id
      or new.processor_id<>old.processor_id or new.proposed_quantity<>old.proposed_quantity
      or new.proposed_price_paise<>old.proposed_price_paise
      or new.material_specification<>old.material_specification then
      raise exception 'Acceptance proposal fields cannot be changed';
    end if;
    if auth.uid()=old.listing_owner_id and new.status not in ('accepted','rejected') then
      raise exception 'Listing owner may accept or reject';
    end if;
    if auth.uid()=old.processor_id and new.status<>'withdrawn' then
      raise exception 'Processor may withdraw a pending request';
    end if;
    if old.status<>'pending' then raise exception 'Acceptance request is already decided'; end if;
  end if;
  new.updated_at:=now();
  return new;
end;
$$;
revoke all on function private.guard_farmloop_acceptance() from public, anon, authenticated;
