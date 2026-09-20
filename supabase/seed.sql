-- Local development only (`supabase db reset`). Never used on the hosted project.
-- Fictional people. Sign in locally via magic link (Inbucket at http://127.0.0.1:54324).

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
(
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-bbbb-cccc-dddd-000000000001',
  'authenticated', 'authenticated', 'admin@ormakkoodu.local',
  crypt('ormakkoodu', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Anu Admin","batch_year":"2007","branch":"CSE","consent":"true","consent_version":"1.0"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-bbbb-cccc-dddd-000000000002',
  'authenticated', 'authenticated', 'moderator@ormakkoodu.local',
  crypt('ormakkoodu', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Maya Moderator","batch_year":"2008","branch":"ECE","consent":"true","consent_version":"1.0"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-bbbb-cccc-dddd-000000000003',
  'authenticated', 'authenticated', 'member@ormakkoodu.local',
  crypt('ormakkoodu', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Vinu Verified","batch_year":"2007","branch":"CSE","consent":"true","consent_version":"1.0"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-bbbb-cccc-dddd-000000000004',
  'authenticated', 'authenticated', 'pending@ormakkoodu.local',
  crypt('ormakkoodu', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Pooja Pending","batch_year":"2011","branch":"IT","consent":"true","consent_version":"1.0"}'::jsonb,
  now(), now(), '', '', '', ''
);

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
select
  id,
  id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  id::text,
  now(),
  now(),
  now()
from auth.users
where email like '%@ormakkoodu.local';

update public.profiles
set
  consent_accepted_at = now(),
  consent_version = '1.0',
  status = 'verified',
  role = 'admin',
  name = 'Anu Admin',
  batch_year = 2007,
  branch = 'CSE'
where id = 'aaaaaaaa-bbbb-cccc-dddd-000000000001';

update public.profiles
set
  consent_accepted_at = now(),
  consent_version = '1.0',
  status = 'verified',
  role = 'moderator',
  name = 'Maya Moderator',
  batch_year = 2008,
  branch = 'ECE'
where id = 'aaaaaaaa-bbbb-cccc-dddd-000000000002';

update public.profiles
set
  consent_accepted_at = now(),
  consent_version = '1.0',
  status = 'verified',
  role = 'member',
  name = 'Vinu Verified',
  batch_year = 2007,
  branch = 'CSE'
where id = 'aaaaaaaa-bbbb-cccc-dddd-000000000003';

update public.profiles
set
  consent_accepted_at = now(),
  consent_version = '1.0',
  status = 'pending',
  role = 'member',
  name = 'Pooja Pending',
  batch_year = 2011,
  branch = 'IT'
where id = 'aaaaaaaa-bbbb-cccc-dddd-000000000004';

insert into public.alumni_register (name, batch_year, branch, notes) values
  ('Anu Admin', 2007, 'CSE', 'Local seed — fictional'),
  ('Maya Moderator', 2008, 'ECE', 'Local seed — fictional'),
  ('Vinu Verified', 2007, 'CSE', 'Local seed — fictional'),
  ('Pooja Pending', 2011, 'IT', 'Local seed — fictional');

insert into public.batch_groups (
  batch_year, branch, whatsapp_invite_url, coordinator_name, coordinator_contact
) values
  (2007, 'CSE', 'https://chat.whatsapp.com/example-2007-cse', 'Vinu Verified', null),
  (2008, 'ECE', 'https://chat.whatsapp.com/example-2008-ece', 'Maya Moderator', null);
