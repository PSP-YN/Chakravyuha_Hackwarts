alter table public.participant_notifications
  drop constraint if exists participant_notifications_event_type_check;
alter table public.participant_notifications
  add constraint participant_notifications_event_type_check check (event_type in (
    'offer_received','offer_accepted','offer_rejected','offer_withdrawn','offer_completed',
    'processor_request_received','processor_request_accepted','processor_request_rejected','processor_request_withdrawn',
    'booking_created','booking_updated','booking_rescheduled','booking_cancelled','booking_started','booking_completed',
    'dispute_opened','dispute_updated','report_submitted','report_updated',
    'quality_check_submitted','quality_check_updated','listing_moderated'
  ));

create or replace function private.notify_quality_check()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare owner uuid; actor uuid;
begin
  select l.owner_id into owner from public.market_listings l where l.id = new.listing_id;
  if tg_op = 'INSERT' then
    if owner is not null and owner <> new.submitted_by then
      insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
      values (owner,new.submitted_by,'quality_check_submitted','New quality record submitted','A participant submitted a material quality record for your listing.','ಹೊಸ ಗುಣಮಟ್ಟ ದಾಖಲೆ ಸಲ್ಲಿಸಲಾಗಿದೆ','ಭಾಗವಹಿಸುವವರು ನಿಮ್ಮ ಪಟ್ಟಿಗೆ ವಸ್ತು ಗುಣಮಟ್ಟದ ದಾಖಲೆ ಸಲ್ಲಿಸಿದ್ದಾರೆ.','material_quality_checks',new.id::text);
    end if;
  elsif new.verification_status is distinct from old.verification_status then
    actor := coalesce(new.verified_by,auth.uid());
    insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
    values (new.submitted_by,actor,'quality_check_updated','Quality check status updated','A quality record was reviewed. Check its verification status and note.','ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆ ಸ್ಥಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ','ಗುಣಮಟ್ಟದ ದಾಖಲೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಅದರ ಪರಿಶೀಲನಾ ಸ್ಥಿತಿ ಮತ್ತು ಟಿಪ್ಪಣಿಯನ್ನು ನೋಡಿ.','material_quality_checks',new.id::text);
    if owner is not null and owner <> new.submitted_by then
      insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
      values (owner,actor,'quality_check_updated','Quality check status updated','A quality record linked to your listing was reviewed.','ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆ ಸ್ಥಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ','ನಿಮ್ಮ ಪಟ್ಟಿಗೆ ಸಂಬಂಧಿಸಿದ ಗುಣಮಟ್ಟದ ದಾಖಲೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.','material_quality_checks',new.id::text);
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.notify_quality_check() from public, anon, authenticated;
drop trigger if exists notify_quality_check_event on public.material_quality_checks;
create trigger notify_quality_check_event after insert or update of verification_status on public.material_quality_checks for each row execute function private.notify_quality_check();

create or replace function private.notify_listing_moderation()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare owner uuid;
begin
  select l.owner_id into owner from public.market_listings l where l.id = new.listing_id;
  if owner is not null then
    insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
    values (owner,new.admin_id,'listing_moderated','Your listing was reviewed','A moderator changed the status of your listing. Read the moderation reason in your activity history.','ನಿಮ್ಮ ಪಟ್ಟಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ','ಮಾಡರೇಟರ್ ನಿಮ್ಮ ಪಟ್ಟಿಯ ಸ್ಥಿತಿಯನ್ನು ಬದಲಿಸಿದ್ದಾರೆ. ನಿಮ್ಮ ಚಟುವಟಿಕೆ ಇತಿಹಾಸದಲ್ಲಿ ಕಾರಣವನ್ನು ನೋಡಿ.','listing_moderation_actions',new.id::text);
  end if;
  return new;
end;
$$;
revoke all on function private.notify_listing_moderation() from public, anon, authenticated;
drop trigger if exists notify_listing_moderation_event on public.listing_moderation_actions;
create trigger notify_listing_moderation_event after insert on public.listing_moderation_actions for each row execute function private.notify_listing_moderation();
