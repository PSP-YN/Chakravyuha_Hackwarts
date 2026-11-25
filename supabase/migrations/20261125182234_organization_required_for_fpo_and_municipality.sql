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
    and nullif(btrim(coalesce(new.village,'')),'') is not null
    and (new.participant_type not in ('municipality','fpo_cooperative') or nullif(btrim(coalesce(new.organization_name,'')),'') is not null);
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  selected_role text;
  full_name text;
  phone_number text;
  district_name text;
  taluk_name text;
  village_name text;
  organisation text;
begin
  selected_role := new.raw_user_meta_data->>'participant_type';
  if selected_role is null or selected_role not in ('farmer','buyer_trader','machinery_owner','waste_processor','municipality','transporter','fpo_cooperative') then selected_role := 'farmer'; end if;
  full_name := nullif(left(btrim(coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name','')),80),'');
  phone_number := nullif(left(btrim(coalesce(new.raw_user_meta_data->>'phone','')),20),'');
  district_name := nullif(left(btrim(coalesce(new.raw_user_meta_data->>'district','')),80),'');
  taluk_name := nullif(left(btrim(coalesce(new.raw_user_meta_data->>'taluk','')),80),'');
  village_name := nullif(left(btrim(coalesce(new.raw_user_meta_data->>'village','')),100),'');
  organisation := nullif(left(btrim(coalesce(new.raw_user_meta_data->>'organization_name','')),160),'');
  insert into public.user_profiles(user_id,display_name,preferred_language,participant_type,phone,district,taluk,village,organization_name,profile_completed)
  values (new.id,full_name,case when new.raw_user_meta_data->>'preferred_language'='kn' then 'kn' else 'en' end,selected_role,phone_number,district_name,taluk_name,village_name,organisation,
    full_name is not null and phone_number is not null and district_name is not null and taluk_name is not null and village_name is not null
    and (selected_role not in ('municipality','fpo_cooperative') or organisation is not null))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

update public.user_profiles set profile_completed=false
where participant_type in ('municipality','fpo_cooperative') and nullif(btrim(coalesce(organization_name,'')),'') is null;
