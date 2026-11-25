create or replace function private.guard_profile_update()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() = old.user_id and not public.is_platform_admin() then
    if new.verification_status not in (old.verification_status,'pending') then
      raise exception 'Only platform administrators may verify or reject a participant';
    end if;
    if new.participant_type is distinct from old.participant_type then
      raise exception 'Participant type is fixed at registration; contact support for a correction';
    end if;
    new.verification_note := old.verification_note;
  end if;
  new.profile_completed :=
    nullif(btrim(coalesce(new.display_name,'')),'') is not null
    and char_length(btrim(coalesce(new.display_name,''))) >= 2
    and nullif(btrim(coalesce(new.phone,'')),'') is not null
    and nullif(btrim(coalesce(new.district,'')),'') is not null
    and nullif(btrim(coalesce(new.taluk,'')),'') is not null
    and nullif(btrim(coalesce(new.village,'')),'') is not null;
  new.updated_at := now();
  return new;
end;
$$;

drop policy if exists "owner inserts listings" on public.market_listings;
create policy "participants publish listings for their role"
  on public.market_listings for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and status = 'active'
    and exists (
      select 1 from public.user_profiles p
      where p.user_id = (select auth.uid())
        and p.profile_completed = true
        and (
          (category = 'produce' and p.participant_type in ('farmer','buyer_trader','fpo_cooperative'))
          or (category = 'byproduct' and p.participant_type in ('farmer','fpo_cooperative'))
          or (category = 'machinery' and p.participant_type = 'machinery_owner')
          or (category = 'transport' and p.participant_type = 'transporter')
        )
    )
  );

drop policy if exists "buyer offers on active listings" on public.market_offers;
create policy "complete participants offer on active listings"
  on public.market_offers for insert to authenticated
  with check (
    status = 'pending'
    and buyer_id = (select auth.uid())
    and owner_id <> (select auth.uid())
    and exists (
      select 1
      from public.market_listings l
      join public.user_profiles p on p.user_id = (select auth.uid())
      where l.id = market_offers.listing_id
        and l.owner_id = market_offers.owner_id
        and l.status = 'active'
        and l.quantity >= market_offers.accepted_quantity
        and p.profile_completed = true
        and p.participant_type in ('farmer','buyer_trader','machinery_owner','waste_processor','transporter','fpo_cooperative')
    )
  );

drop policy if exists "processor submits acceptance" on public.farmloop_processor_acceptances;
create policy "complete waste processors submit acceptance"
  on public.farmloop_processor_acceptances for insert to authenticated
  with check (
    processor_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1 from public.user_profiles p
      where p.user_id = (select auth.uid())
        and p.profile_completed = true
        and p.participant_type in ('processor','waste_processor')
    )
    and exists (
      select 1 from public.market_listings l
      where l.id = farmloop_processor_acceptances.listing_id
        and l.owner_id = farmloop_processor_acceptances.listing_owner_id
        and l.category = 'byproduct'
        and l.status = 'active'
    )
  );
