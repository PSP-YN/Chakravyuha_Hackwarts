alter table public.user_profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists privacy_notice_version text;
create or replace function private.normalize_karnataka_district(input_value text)
returns text language sql immutable set search_path = ''
as $$
  select case lower(btrim(coalesce(input_value,'')))
    when 'mysore' then 'Mysuru'
    when 'mysore district' then 'Mysuru'
    when 'mysuru district' then 'Mysuru'
    when 'tumkur' then 'Tumakuru'
    when 'tumkur district' then 'Tumakuru'
    when 'tumakuru district' then 'Tumakuru'
    when 'bangalore urban' then 'Bengaluru Urban'
    when 'bengaluru urban district' then 'Bengaluru Urban'
    when 'bangalore urban district' then 'Bengaluru Urban'
    when 'bengaluru' then 'Bengaluru Urban'
    when 'bangalore' then 'Bengaluru Urban'
    else nullif(initcap(btrim(input_value)),'')
  end;
$$;
revoke all on function private.normalize_karnataka_district(text) from public,anon,authenticated;

alter table public.user_profiles drop constraint if exists user_profiles_policy_consent_complete_check;
alter table public.user_profiles add constraint user_profiles_policy_consent_complete_check check (
  (terms_accepted_at is null and terms_version is null and privacy_notice_version is null)
  or (terms_accepted_at is not null and terms_version is not null and privacy_notice_version is not null)
);

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
    if new.terms_accepted_at is distinct from old.terms_accepted_at
      or new.terms_version is distinct from old.terms_version
      or new.privacy_notice_version is distinct from old.privacy_notice_version then
      raise exception 'Policy consent records are immutable';
    end if;
    new.verification_note := old.verification_note;
  end if;
  new.district := private.normalize_karnataka_district(new.district);
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
  terms_version_value text;
  privacy_version_value text;
begin
  if coalesce(new.raw_user_meta_data->>'accepted_terms','false') <> 'true' then
    raise exception 'Terms of use and the privacy notice must be accepted before registration';
  end if;
  terms_version_value := new.raw_user_meta_data->>'terms_version';
  privacy_version_value := new.raw_user_meta_data->>'privacy_notice_version';
  if terms_version_value <> '2026-11-25' or privacy_version_value <> '2026-11-25' then
    raise exception 'Please review and accept the current terms and privacy notice';
  end if;
  selected_role := new.raw_user_meta_data->>'participant_type';
  if selected_role is null or selected_role not in ('farmer','buyer_trader','machinery_owner','waste_processor','municipality','transporter','fpo_cooperative') then
    selected_role := 'farmer';
  end if;
  full_name := nullif(left(btrim(coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name','')),80),'');
  phone_number := nullif(left(btrim(coalesce(new.raw_user_meta_data->>'phone','')),20),'');
  district_name := private.normalize_karnataka_district(nullif(left(btrim(coalesce(new.raw_user_meta_data->>'district','')),80),''));
  taluk_name := nullif(left(btrim(coalesce(new.raw_user_meta_data->>'taluk','')),80),'');
  village_name := nullif(left(btrim(coalesce(new.raw_user_meta_data->>'village','')),100),'');
  organisation := nullif(left(btrim(coalesce(new.raw_user_meta_data->>'organization_name','')),160),'');
  insert into public.user_profiles(user_id,display_name,preferred_language,participant_type,phone,district,taluk,village,organization_name,profile_completed,terms_accepted_at,terms_version,privacy_notice_version)
  values (
    new.id,full_name,
    case when new.raw_user_meta_data->>'preferred_language'='kn' then 'kn' else 'en' end,
    selected_role,phone_number,district_name,taluk_name,village_name,organisation,
    full_name is not null and phone_number is not null and district_name is not null and taluk_name is not null and village_name is not null
      and (selected_role not in ('municipality','fpo_cooperative') or organisation is not null),
    now(),terms_version_value,privacy_version_value
  ) on conflict (user_id) do nothing;
  return new;
end;
$$;
