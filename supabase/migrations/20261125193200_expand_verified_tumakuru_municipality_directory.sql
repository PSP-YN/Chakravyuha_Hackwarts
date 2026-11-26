-- Directory details were checked against the Karnataka district administration public-utility pages on 2026-11-26.
-- Missing phone/email values are intentionally NULL; do not infer them.
insert into public.municipality_contacts
  (district,taluk,jurisdiction,office_name,contact_person,phone,email,address,services,source_url,verified_at,is_active)
select v.district,v.taluk,v.jurisdiction,v.office_name,null,v.phone,null,v.address,
  array['Municipal civic services enquiries','Confirm local waste collection service availability']::text[],
  v.source_url,'2026-11-26'::date,true
from (values
  ('Tumakuru','Sira','City Municipal Council jurisdiction — Sira taluk','City Municipal Council Sira','08135-277324','Mair Road, Sira, Karnataka 572137','https://tumkur.nic.in/en/public-utility-category/municipality/'),
  ('Tumakuru','Tiptur','City Municipal Council jurisdiction — Tiptur taluk','City Municipal Council Tiptur',null,'Krishna Raja Extension, Tiptur, Karnataka 572201','https://tumkur.nic.in/en/public-utility-category/municipality/'),
  ('Tumakuru','Gubbi','Town Panchayat jurisdiction — Gubbi taluk','Town Panchayat Gubbi','08131-22224','BH Road, Gubbi, Tumakuru District, Karnataka 572216','https://tumkur.nic.in/en/public-utility-category/municipality/'),
  ('Tumakuru','Koratagere','Town Panchayat jurisdiction — Koratagere taluk','Town Panchayat Koratagere','9448279058','Koratagere Main Road, Tumakuru District, Karnataka 572129','https://tumkur.nic.in/en/public-utility-category/municipality/'),
  ('Tumakuru','Turuvekere','Town Panchayat jurisdiction — Turuvekere taluk','Town Panchayat Turuvekere',null,'BS Road, Turuvekere, Tumakuru District, Karnataka 571401','https://tumkur.nic.in/en/public-utility-category/municipality/'),
  ('Tumakuru','Madhugiri','Town Municipal Council jurisdiction — Madhugiri taluk','Town Municipal Council Madhugiri','08137-282328','Town Hall Road, Madhugiri, Tumakuru District, Karnataka 572132','https://tumkur.nic.in/en/public-utility-category/municipality/'),
  ('Tumakuru','Chikkanayakanahalli','Town Municipal Council jurisdiction — Chikkanayakanahalli taluk','Town Municipal Council Chikkanayakanahalli',null,'Nehru Circle, BH Road, Chikkanayakanahalli, Tumakuru District, Karnataka 572214','https://tumkur.nic.in/en/public-utility-category/municipality/'),
  ('Tumakuru','Kunigal','Town Municipal Council jurisdiction — Kunigal taluk','Town Municipal Council Kunigal','08132-220225','BM Road, Kunigal, Tumakuru District, Karnataka 572130','https://tumkur.nic.in/en/public-utility-category/municipality/'),
  ('Tumakuru','Pavagada','Town Municipal Council jurisdiction — Pavagada taluk','Town Municipal Council Pavagada','9448279057','Kote Anjaneya Temple Road, Pavagada, Tumakuru District, Karnataka 561202','https://tumkur.nic.in/en/public-utility-category/municipality/')
) as v(district,taluk,jurisdiction,office_name,phone,address,source_url)
where not exists (
  select 1 from public.municipality_contacts c
  where lower(c.district)=lower(v.district) and lower(c.office_name)=lower(v.office_name)
);

update public.municipality_contacts
set phone='08228-265532',
    source_url='https://mysore.nic.in/public-utility-category/%E0%B2%AA%E0%B3%81%E0%B2%B0%E0%B2%B8%E0%B2%AD%E0%B3%86%E0%B2%97%E0%B2%B3%E0%B3%81/',
    verified_at='2026-11-26'::date,updated_at=now()
where district='Mysuru' and office_name='Sargur Town Panchayat' and phone is null;

update public.municipality_contacts
set source_url='https://apps.bbmp.gov.in/SWM/Home/Forms/Home.aspx',verified_at='2026-11-26'::date,updated_at=now()
where district='Bengaluru Urban' and office_name like 'BBMP SWM%';
