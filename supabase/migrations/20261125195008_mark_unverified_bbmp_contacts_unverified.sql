-- Remove the earlier BBMP SWM directory rows from the active verified list.
-- The next migration reactivates only the contacts checked against official sources.
update public.municipality_contacts
set is_active=false, verified_at=null, verified_by=null, updated_at=now()
where district='Bengaluru Urban'
  and office_name in (
    'BBMP SWM Department — Chief Engineer',
    'BBMP SWM Department — Joint Commissioner',
    'BBMP SWM Department — Special Commissioner',
    'BBMP SWM Public Grievance Helpline'
  );
