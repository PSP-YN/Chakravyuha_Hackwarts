create table if not exists public.participant_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in (
    'offer_received','offer_accepted','offer_rejected','offer_withdrawn','offer_completed',
    'processor_request_received','processor_request_accepted','processor_request_rejected','processor_request_withdrawn',
    'booking_created','booking_updated','booking_rescheduled','booking_cancelled','booking_started','booking_completed',
    'dispute_opened','dispute_updated','report_submitted','report_updated'
  )),
  title_en text not null check (char_length(title_en) between 2 and 120),
  body_en text not null check (char_length(body_en) between 2 and 500),
  title_kn text not null check (char_length(title_kn) between 2 and 160),
  body_kn text not null check (char_length(body_kn) between 2 and 600),
  related_table text,
  related_id text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists participant_notifications_inbox_idx on public.participant_notifications(recipient_id, created_at desc);
create index if not exists participant_notifications_unread_idx on public.participant_notifications(recipient_id, created_at desc) where read_at is null;
alter table public.participant_notifications enable row level security;
drop policy if exists "recipients read own notifications" on public.participant_notifications;
create policy "recipients read own notifications" on public.participant_notifications for select to authenticated using (recipient_id = (select auth.uid()));
drop policy if exists "recipients mark own notifications read" on public.participant_notifications;
create policy "recipients mark own notifications read" on public.participant_notifications for update to authenticated using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
revoke all on public.participant_notifications from anon, authenticated;
grant select on public.participant_notifications to authenticated;
grant update(read_at) on public.participant_notifications to authenticated;

create or replace function private.notify_market_offer()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare recipient uuid; actor uuid; kind text; title_en text; body_en text; title_kn text; body_kn text;
begin
  if tg_op = 'INSERT' then
    recipient := new.owner_id; actor := new.buyer_id; kind := 'offer_received';
    title_en := 'New offer received'; body_en := 'A participant submitted an offer on your listing.';
    title_kn := 'ಹೊಸ ಕೊಡುಗೆ ಬಂದಿದೆ'; body_kn := 'ನಿಮ್ಮ ಪಟ್ಟಿಗೆ ಭಾಗವಹಿಸುವವರು ಕೊಡುಗೆ ಸಲ್ಲಿಸಿದ್ದಾರೆ.';
  elsif new.status is distinct from old.status then
    actor := auth.uid();
    if new.status = 'accepted' then
      recipient := new.buyer_id; kind := 'offer_accepted'; title_en := 'Your offer was accepted'; body_en := 'The listing owner accepted your offer.';
      title_kn := 'ನಿಮ್ಮ ಕೊಡುಗೆ ಒಪ್ಪಲಾಗಿದೆ'; body_kn := 'ಪಟ್ಟಿ ಮಾಲೀಕರು ನಿಮ್ಮ ಕೊಡುಗೆಯನ್ನು ಒಪ್ಪಿಕೊಂಡಿದ್ದಾರೆ.';
    elsif new.status = 'rejected' then
      recipient := new.buyer_id; kind := 'offer_rejected'; title_en := 'Your offer was declined'; body_en := 'The listing owner declined your offer.';
      title_kn := 'ನಿಮ್ಮ ಕೊಡುಗೆ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ'; body_kn := 'ಪಟ್ಟಿ ಮಾಲೀಕರು ನಿಮ್ಮ ಕೊಡುಗೆಯನ್ನು ತಿರಸ್ಕರಿಸಿದ್ದಾರೆ.';
    elsif new.status = 'withdrawn' then
      recipient := new.owner_id; kind := 'offer_withdrawn'; title_en := 'An offer was withdrawn'; body_en := 'The buyer withdrew a pending offer on your listing.';
      title_kn := 'ಕೊಡುಗೆ ಹಿಂಪಡೆಯಲಾಗಿದೆ'; body_kn := 'ಖರೀದಿದಾರರು ನಿಮ್ಮ ಪಟ್ಟಿಯ ಬಾಕಿ ಕೊಡುಗೆಯನ್ನು ಹಿಂಪಡೆದಿದ್ದಾರೆ.';
    elsif new.status = 'completed' then
      recipient := new.buyer_id; kind := 'offer_completed'; title_en := 'Offer marked complete'; body_en := 'The seller marked the transaction as complete. This is not proof of payment.';
      title_kn := 'ಕೊಡುಗೆ ಪೂರ್ಣಗೊಂಡಿದೆ'; body_kn := 'ಮಾರಾಟಗಾರರು ವಹಿವಾಟನ್ನು ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಿದ್ದಾರೆ. ಇದು ಪಾವತಿಯ ಸಾಕ್ಷ್ಯವಲ್ಲ.';
    end if;
  end if;
  if recipient is not null then
    insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
    values (recipient,actor,kind,title_en,body_en,title_kn,body_kn,'market_offers',new.id::text);
  end if;
  return new;
end;
$$;
revoke all on function private.notify_market_offer() from public, anon, authenticated;
drop trigger if exists notify_market_offer_event on public.market_offers;
create trigger notify_market_offer_event after insert or update of status on public.market_offers for each row execute function private.notify_market_offer();

create or replace function private.notify_farmloop_acceptance()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare recipient uuid; actor uuid; kind text; title_en text; body_en text; title_kn text; body_kn text;
begin
  if tg_op = 'INSERT' then
    recipient := new.listing_owner_id; actor := new.processor_id; kind := 'processor_request_received';
    title_en := 'Processor interest received'; body_en := 'A waste processor requested to accept your material listing.';
    title_kn := 'ಸಂಸ್ಕಾರಕರ ಆಸಕ್ತಿ ಬಂದಿದೆ'; body_kn := 'ತ್ಯಾಜ್ಯ ಸಂಸ್ಕಾರಕರು ನಿಮ್ಮ ವಸ್ತು ಪಟ್ಟಿಯನ್ನು ಸ್ವೀಕರಿಸಲು ವಿನಂತಿಸಿದ್ದಾರೆ.';
  elsif new.status is distinct from old.status then
    actor := auth.uid();
    if new.status = 'accepted' then
      recipient := new.processor_id; kind := 'processor_request_accepted'; title_en := 'Processor request accepted'; body_en := 'The listing owner accepted your material request.';
      title_kn := 'ಸಂಸ್ಕಾರಕರ ವಿನಂತಿ ಒಪ್ಪಲಾಗಿದೆ'; body_kn := 'ಪಟ್ಟಿ ಮಾಲೀಕರು ನಿಮ್ಮ ವಸ್ತು ವಿನಂತಿಯನ್ನು ಒಪ್ಪಿಕೊಂಡಿದ್ದಾರೆ.';
    elsif new.status = 'rejected' then
      recipient := new.processor_id; kind := 'processor_request_rejected'; title_en := 'Processor request declined'; body_en := 'The listing owner declined your material request.';
      title_kn := 'ಸಂಸ್ಕಾರಕರ ವಿನಂತಿ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ'; body_kn := 'ಪಟ್ಟಿ ಮಾಲೀಕರು ನಿಮ್ಮ ವಸ್ತು ವಿನಂತಿಯನ್ನು ತಿರಸ್ಕರಿಸಿದ್ದಾರೆ.';
    elsif new.status = 'withdrawn' then
      recipient := new.listing_owner_id; kind := 'processor_request_withdrawn'; title_en := 'Processor request withdrawn'; body_en := 'The processor withdrew their request.';
      title_kn := 'ಸಂಸ್ಕಾರಕರ ವಿನಂತಿ ಹಿಂಪಡೆಯಲಾಗಿದೆ'; body_kn := 'ಸಂಸ್ಕಾರಕರು ತಮ್ಮ ವಿನಂತಿಯನ್ನು ಹಿಂಪಡೆದಿದ್ದಾರೆ.';
    end if;
  end if;
  if recipient is not null then
    insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
    values (recipient,actor,kind,title_en,body_en,title_kn,body_kn,'farmloop_processor_acceptances',new.id::text);
  end if;
  return new;
end;
$$;
revoke all on function private.notify_farmloop_acceptance() from public, anon, authenticated;
drop trigger if exists notify_farmloop_acceptance_event on public.farmloop_processor_acceptances;
create trigger notify_farmloop_acceptance_event after insert or update of status on public.farmloop_processor_acceptances for each row execute function private.notify_farmloop_acceptance();

create or replace function private.notify_machinery_booking()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare recipient uuid; actor uuid; kind text; title_en text; body_en text; title_kn text; body_kn text;
begin
  if tg_op = 'INSERT' then
    recipient := new.requester_id; actor := new.provider_id; kind := 'booking_created';
    title_en := 'Machinery booking created'; body_en := 'The accepted machinery request has created a booking.';
    title_kn := 'ಯಂತ್ರೋಪಕರಣ ಬುಕಿಂಗ್ ರಚಿಸಲಾಗಿದೆ'; body_kn := 'ಒಪ್ಪಿಕೊಂಡ ಯಂತ್ರೋಪಕರಣ ವಿನಂತಿಯಿಂದ ಬುಕಿಂಗ್ ರಚಿಸಲಾಗಿದೆ.';
  elsif new.status is distinct from old.status or new.scheduled_start is distinct from old.scheduled_start then
    actor := auth.uid(); recipient := case when actor = new.requester_id then new.provider_id else new.requester_id end;
    if new.status = 'rescheduled' or new.scheduled_start is distinct from old.scheduled_start then
      kind := 'booking_rescheduled'; title_en := 'Machinery booking rescheduled'; body_en := 'The service time for a machinery booking changed.';
      title_kn := 'ಯಂತ್ರೋಪಕರಣ ಬುಕಿಂಗ್ ಮರುನಿಗದಿಯಾಗಿದೆ'; body_kn := 'ಯಂತ್ರೋಪಕರಣ ಸೇವೆಯ ಸಮಯ ಬದಲಾಗಿದೆ.';
    elsif new.status = 'cancelled' then
      kind := 'booking_cancelled'; title_en := 'Machinery booking cancelled'; body_en := 'A machinery booking was cancelled.';
      title_kn := 'ಯಂತ್ರೋಪಕರಣ ಬುಕಿಂಗ್ ರದ್ದಾಗಿದೆ'; body_kn := 'ಯಂತ್ರೋಪಕರಣ ಬುಕಿಂಗ್ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.';
    elsif new.status = 'in_progress' then
      kind := 'booking_started'; title_en := 'Machinery job started'; body_en := 'The provider marked the machinery job as started.';
      title_kn := 'ಯಂತ್ರೋಪಕರಣ ಕೆಲಸ ಪ್ರಾರಂಭವಾಗಿದೆ'; body_kn := 'ಪೂರೈಕೆದಾರರು ಯಂತ್ರೋಪಕರಣ ಕೆಲಸ ಪ್ರಾರಂಭವಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿದ್ದಾರೆ.';
    elsif new.status = 'completed' then
      kind := 'booking_completed'; title_en := 'Machinery job completed'; body_en := 'The provider marked the machinery job as completed.';
      title_kn := 'ಯಂತ್ರೋಪಕರಣ ಕೆಲಸ ಪೂರ್ಣಗೊಂಡಿದೆ'; body_kn := 'ಪೂರೈಕೆದಾರರು ಯಂತ್ರೋಪಕರಣ ಕೆಲಸ ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಿದ್ದಾರೆ.';
    else
      kind := 'booking_updated'; title_en := 'Machinery booking updated'; body_en := 'A machinery booking was updated.';
      title_kn := 'ಯಂತ್ರೋಪಕರಣ ಬುಕಿಂಗ್ ನವೀಕರಿಸಲಾಗಿದೆ'; body_kn := 'ಯಂತ್ರೋಪಕರಣ ಬುಕಿಂಗ್ ನವೀಕರಿಸಲಾಗಿದೆ.';
    end if;
  end if;
  if recipient is not null then
    insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
    values (recipient,actor,kind,title_en,body_en,title_kn,body_kn,'machinery_bookings',new.id::text);
  end if;
  return new;
end;
$$;
revoke all on function private.notify_machinery_booking() from public, anon, authenticated;
drop trigger if exists notify_machinery_booking_event on public.machinery_bookings;
create trigger notify_machinery_booking_event after insert or update of status, scheduled_start on public.machinery_bookings for each row execute function private.notify_machinery_booking();

create or replace function private.notify_market_dispute()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare buyer uuid; owner uuid; other_party uuid; recipient uuid; actor uuid; kind text; title_en text; body_en text; title_kn text; body_kn text;
begin
  select o.buyer_id,o.owner_id into buyer,owner from public.market_offers o where o.id=new.offer_id;
  if tg_op = 'INSERT' then
    other_party := case when new.opened_by = buyer then owner else buyer end;
    recipient := other_party; actor := new.opened_by; kind := 'dispute_opened';
    title_en := 'A transaction dispute was opened'; body_en := 'A participant raised an issue on a shared transaction.';
    title_kn := 'ವಹಿವಾಟಿನ ವಿವಾದ ತೆರೆಯಲಾಗಿದೆ'; body_kn := 'ಹಂಚಿಕೊಂಡ ವಹಿವಾಟಿನ ಕುರಿತು ಭಾಗವಹಿಸುವವರು ಸಮಸ್ಯೆ ದಾಖಲಿಸಿದ್ದಾರೆ.';
    insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
    values (recipient,actor,kind,title_en,body_en,title_kn,body_kn,'market_disputes',new.id::text);
  elsif new.status is distinct from old.status then
    actor := coalesce(new.reviewed_by,auth.uid()); kind := 'dispute_updated';
    title_en := 'Transaction dispute updated'; body_en := 'The status of a transaction dispute changed.';
    title_kn := 'ವಹಿವಾಟಿನ ವಿವಾದ ನವೀಕರಿಸಲಾಗಿದೆ'; body_kn := 'ವಹಿವಾಟಿನ ವಿವಾದದ ಸ್ಥಿತಿ ಬದಲಾಗಿದೆ.';
    insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
    values (new.opened_by,actor,kind,title_en,body_en,title_kn,body_kn,'market_disputes',new.id::text);
    other_party := case when new.opened_by = buyer then owner else buyer end;
    if other_party is not null and other_party <> new.opened_by then
      insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
      values (other_party,actor,kind,title_en,body_en,title_kn,body_kn,'market_disputes',new.id::text);
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.notify_market_dispute() from public, anon, authenticated;
drop trigger if exists notify_market_dispute_event on public.market_disputes;
create trigger notify_market_dispute_event after insert or update of status on public.market_disputes for each row execute function private.notify_market_dispute();

create or replace function private.notify_participant_report()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare admin_row record;
begin
  if tg_op = 'INSERT' then
    for admin_row in select id from auth.users where raw_app_meta_data->>'role' = 'admin' loop
      insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
      values (admin_row.id,new.reporter_id,'report_submitted','New participant report','A participant submitted a listing or user report.','ಹೊಸ ಭಾಗವಹಿಸುವವರ ವರದಿ','ಭಾಗವಹಿಸುವವರು ಪಟ್ಟಿ ಅಥವಾ ಬಳಕೆದಾರರ ಕುರಿತು ವರದಿ ಸಲ್ಲಿಸಿದ್ದಾರೆ.','participant_reports',new.id::text);
    end loop;
  elsif new.status is distinct from old.status then
    insert into public.participant_notifications(recipient_id,actor_id,event_type,title_en,body_en,title_kn,body_kn,related_table,related_id)
    values (new.reporter_id,coalesce(new.reviewed_by,auth.uid()),'report_updated','Participant report updated','The status of your submitted report changed.','ಭಾಗವಹಿಸುವವರ ವರದಿ ನವೀಕರಿಸಲಾಗಿದೆ','ನೀವು ಸಲ್ಲಿಸಿದ ವರದಿಯ ಸ್ಥಿತಿ ಬದಲಾಗಿದೆ.','participant_reports',new.id::text);
  end if;
  return new;
end;
$$;
revoke all on function private.notify_participant_report() from public, anon, authenticated;
drop trigger if exists notify_participant_report_event on public.participant_reports;
create trigger notify_participant_report_event after insert or update of status on public.participant_reports for each row execute function private.notify_participant_report();
