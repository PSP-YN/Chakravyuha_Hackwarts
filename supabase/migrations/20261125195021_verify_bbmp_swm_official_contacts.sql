-- Reactivate only the four BBMP SWM contacts checked against official BBMP pages.
update public.municipality_contacts
set is_active=true,
    verified_at=date '2026-11-26',
    source_url=case
      when office_name='BBMP SWM Public Grievance Helpline'
        then 'https://site.bbmp.gov.in/contact.html'
      else 'https://apps.bbmpgov.in/SWM/Home/Forms/Publicaboutus.aspx?Page=Contact'
    end,
    updated_at=now()
where district='Bengaluru Urban'
  and office_name in (
    'BBMP SWM Department — Chief Engineer',
    'BBMP SWM Department — Joint Commissioner',
    'BBMP SWM Department — Special Commissioner',
    'BBMP SWM Public Grievance Helpline'
  );
