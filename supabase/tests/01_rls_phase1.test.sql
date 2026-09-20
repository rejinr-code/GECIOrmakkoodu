-- Phase 1 authorisation proofs.
-- Guest cannot read unapproved rows. Pending members cannot publish.
-- Run: npx supabase test db

begin;

select plan(20);

-- ---------------------------------------------------------------------------
-- Fixtures: four alumni + one approved photo + one pending photo + articles
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
(
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'pending@test.ormakkoodu',
  crypt('password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Pending Pal","batch_year":"2007","branch":"CSE","consent":"true","consent_version":"1.0"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated', 'authenticated', 'member@test.ormakkoodu',
  crypt('password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Verified Vinu","batch_year":"2007","branch":"ECE","consent":"true","consent_version":"1.0"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-3333-3333-333333333333',
  'authenticated', 'authenticated', 'mod@test.ormakkoodu',
  crypt('password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Moderator Maya","batch_year":"2005","branch":"EEE","consent":"true","consent_version":"1.0"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '44444444-4444-4444-4444-444444444444',
  'authenticated', 'authenticated', 'admin@test.ormakkoodu',
  crypt('password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Admin Anu","batch_year":"2004","branch":"IT","consent":"true","consent_version":"1.0"}'::jsonb,
  now(), now(), '', '', '', ''
);

update public.profiles
set
  consent_accepted_at = now(),
  consent_version = '1.0',
  batch_year = 2007,
  branch = 'CSE',
  name = 'Pending Pal'
where id = '11111111-1111-1111-1111-111111111111';

update public.profiles
set
  status = 'verified',
  consent_accepted_at = now(),
  consent_version = '1.0',
  batch_year = 2007,
  branch = 'ECE',
  name = 'Verified Vinu'
where id = '22222222-2222-2222-2222-222222222222';

update public.profiles
set
  status = 'verified',
  role = 'moderator',
  consent_accepted_at = now(),
  consent_version = '1.0',
  batch_year = 2005,
  branch = 'EEE',
  name = 'Moderator Maya'
where id = '33333333-3333-3333-3333-333333333333';

update public.profiles
set
  status = 'verified',
  role = 'admin',
  consent_accepted_at = now(),
  consent_version = '1.0',
  batch_year = 2004,
  branch = 'IT',
  name = 'Admin Anu'
where id = '44444444-4444-4444-4444-444444444444';

insert into public.photos (
  id, uploader_id, storage_key, thumb_key, caption, alt_text,
  batch_year, licence_confirmed, width, height, bytes, status
) values
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222/p1/original.webp',
  '22222222-2222-2222-2222-222222222222/p1/thumb.webp',
  'Approved hostel corridor',
  'Hostel corridor at dusk',
  2007, true, 1600, 900, 120000, 'approved'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222/p2/original.webp',
  '22222222-2222-2222-2222-222222222222/p2/thumb.webp',
  'Pending classroom',
  'Classroom before a lab',
  2007, true, 1600, 900, 110000, 'pending'
);

insert into public.articles (
  id, author_id, title, slug, body, batch_year, status, published_at
) values
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  '22222222-2222-2222-2222-222222222222',
  'Published letter',
  'published-letter',
  'A short campus letter.',
  2007, 'published', now()
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
  '22222222-2222-2222-2222-222222222222',
  'Pending letter',
  'pending-letter',
  'Not yet public.',
  2007, 'pending', null
);

insert into public.batch_groups (batch_year, branch, whatsapp_invite_url, coordinator_contact)
values (2007, 'CSE', 'https://chat.whatsapp.com/example', '9999999999');

insert into public.alumni_register (name, batch_year, branch)
values ('Register Row', 2007, 'CSE');

insert into public.audit_log (actor_id, action, target_type, target_id)
values (null, 'test.seed', 'system', null);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function pg_temp.set_auth(p_id uuid, p_role text, p_status text)
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', p_id::text,
      'role', 'authenticated',
      'user_role', p_role,
      'user_status', p_status
    )::text,
    true
  );
  perform set_config('request.jwt.claim.sub', p_id::text, true);
end;
$$;

create or replace function pg_temp.clear_auth()
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('role', 'anon', true);
end;
$$;

grant execute on function pg_temp.set_auth(uuid, text, text) to public;
grant execute on function pg_temp.clear_auth() to public;

-- ===========================================================================
-- Guest (anon)
-- ===========================================================================

select pg_temp.clear_auth();

select is(
  (select count(*)::int from public.photos where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  1,
  'guest can read an approved photo'
);

select is(
  (select count(*)::int from public.photos where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
  0,
  'guest cannot read an unapproved photo'
);

select is(
  (select count(*)::int from public.articles where slug = 'published-letter'),
  1,
  'guest can read a published article'
);

select is(
  (select count(*)::int from public.articles where slug = 'pending-letter'),
  0,
  'guest cannot read an unpublished article'
);

select throws_ok(
  $$ insert into public.photos (
       uploader_id, storage_key, thumb_key, alt_text, batch_year,
       licence_confirmed, width, height, bytes
     ) values (
       '22222222-2222-2222-2222-222222222222',
       'x/y/original.webp', 'x/y/thumb.webp', 'no', 2007, true, 10, 10, 10
     ) $$,
  '42501',
  null,
  'guest cannot insert photos'
);

select is(
  (select count(*)::int from public.alumni_register),
  0,
  'guest cannot read the alumni register'
);

select is(
  (select count(*)::int from public.batch_groups),
  0,
  'guest cannot read WhatsApp invite rows'
);

select isnt_empty(
  'select coordinator_name from public.batch_groups_public',
  'guest can see the public batch listing without invite URLs'
);

select hasnt_column(
  'public',
  'public_profiles',
  'phone',
  'public profile projection has no phone column'
);

-- ===========================================================================
-- Pending member — browse, do not contribute
-- ===========================================================================

select pg_temp.set_auth(
  '11111111-1111-1111-1111-111111111111',
  'member',
  'pending'
);

select throws_ok(
  $$ insert into public.photos (
       uploader_id, storage_key, thumb_key, alt_text, batch_year,
       licence_confirmed, width, height, bytes, status
     ) values (
       '11111111-1111-1111-1111-111111111111',
       '11111111-1111-1111-1111-111111111111/n/original.webp',
       '11111111-1111-1111-1111-111111111111/n/thumb.webp',
       'Lab bench',
       2007, true, 800, 600, 20000, 'pending'
     ) $$,
  '42501',
  null,
  'pending member cannot upload a photograph'
);

select throws_ok(
  $$ insert into public.articles (author_id, title, slug, body, status)
     values (
       '11111111-1111-1111-1111-111111111111',
       'Should not publish',
       'should-not-publish',
       'No.',
       'pending'
     ) $$,
  '42501',
  null,
  'pending member cannot submit an article'
);

select is(
  (select count(*)::int from public.photos where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
  0,
  'pending member cannot read someone else’s unapproved photo'
);

select is(
  (select count(*)::int from public.batch_groups),
  0,
  'pending member cannot read WhatsApp invite URLs'
);

-- ===========================================================================
-- Verified member — may contribute, still cannot self-approve
-- ===========================================================================

select pg_temp.set_auth(
  '22222222-2222-2222-2222-222222222222',
  'member',
  'verified'
);

select lives_ok(
  $$ insert into public.photos (
       id, uploader_id, storage_key, thumb_key, alt_text, batch_year,
       licence_confirmed, width, height, bytes, status
     ) values (
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
       '22222222-2222-2222-2222-222222222222',
       '22222222-2222-2222-2222-222222222222/p3/original.webp',
       '22222222-2222-2222-2222-222222222222/p3/thumb.webp',
       'Workshop floor',
       2007, true, 800, 600, 20000, 'pending'
     ) $$,
  'verified member can upload a pending photograph'
);

select throws_ok(
  $$ insert into public.photos (
       uploader_id, storage_key, thumb_key, alt_text, batch_year,
       licence_confirmed, width, height, bytes, status
     ) values (
       '22222222-2222-2222-2222-222222222222',
       '22222222-2222-2222-2222-222222222222/p4/original.webp',
       '22222222-2222-2222-2222-222222222222/p4/thumb.webp',
       'Should not skip moderation',
       2007, true, 800, 600, 20000, 'approved'
     ) $$,
  '42501',
  null,
  'verified member cannot insert an already-approved photograph'
);

select throws_ok(
  $$ update public.photos
        set status = 'approved'
      where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3' $$,
  'P0001',
  null,
  'verified member cannot self-approve a photograph'
);

select is(
  (select count(*)::int from public.batch_groups where whatsapp_invite_url is not null),
  1,
  'verified member can read batch invite URLs'
);

-- ===========================================================================
-- Moderator sees the queue; audit log is append-only
-- ===========================================================================

select pg_temp.set_auth(
  '33333333-3333-3333-3333-333333333333',
  'moderator',
  'verified'
);

select is(
  (select count(*)::int from public.photos where status = 'pending'),
  2,
  'moderator can read the pending photo queue'
);

select pg_temp.set_auth(
  '44444444-4444-4444-4444-444444444444',
  'admin',
  'verified'
);

select throws_ok(
  $$ update public.audit_log set action = 'tampered' $$,
  '42501',
  null,
  'nobody can update the audit log'
);

select throws_ok(
  $$ delete from public.audit_log $$,
  '42501',
  null,
  'nobody can delete the audit log'
);

select * from finish();

rollback;
