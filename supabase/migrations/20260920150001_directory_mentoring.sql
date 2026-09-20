-- Phase 4: searchable alumni directory (opt-in per field) and
-- a moderated mentoring / internship board. No email or phone columns.

alter table public.profiles
  add column if not exists directory_show_city boolean not null default false,
  add column if not exists directory_show_role boolean not null default false,
  add column if not exists directory_show_bio boolean not null default false;

comment on column public.profiles.directory_opt_in is
  'Appear in the searchable directory. Name, batch, and branch only unless a field flag is on.';
comment on column public.profiles.directory_show_city is
  'City is public on the profile page and in the directory.';
comment on column public.profiles.directory_show_role is
  'Current role is public on the profile page and in the directory.';
comment on column public.profiles.directory_show_bio is
  'The short note is public on the profile page and in the directory.';

drop view if exists public.public_profiles;

create view public.public_profiles
with (security_invoker = false)
as
select
  id,
  name,
  batch_year,
  branch,
  avatar_url,
  case when directory_show_bio then bio else null end as bio,
  case when directory_show_city then current_city else null end as current_city,
  case when directory_show_role then "current_role" else null end as "current_role",
  created_at,
  directory_opt_in,
  directory_show_city,
  directory_show_role,
  directory_show_bio
from public.profiles
where status = 'verified'
  and deleted_at is null;

comment on view public.public_profiles is
  'Verified alumni, public columns only. Phone and email never appear here. City, role, and bio follow per-field opt-in.';

grant select on public.public_profiles to anon, authenticated;

create type public.offer_kind as enum ('mentoring', 'internship');

create table public.mentoring_offers (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null,
  kind public.offer_kind not null,
  title text not null check (char_length(trim(title)) > 0),
  body text not null default '',
  city text,
  status public.content_status not null default 'pending',
  moderator_id uuid references public.profiles (id) on delete set null,
  moderated_at timestamptz,
  rejection_reason text,
  anonymised boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.mentoring_offers is
  'Mentoring and internship offers. Contact is via interest rows, never email or phone.';

create table public.mentoring_interest (
  offer_id uuid not null references public.mentoring_offers (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  primary key (offer_id, member_id)
);

comment on table public.mentoring_interest is
  'Verified members say they are interested. Authors see public profile names, never emails.';

create index mentoring_offers_status_created_idx
  on public.mentoring_offers (status, created_at desc)
  where deleted_at is null;

create index mentoring_offers_kind_idx
  on public.mentoring_offers (kind, status)
  where deleted_at is null;

create index mentoring_offers_author_idx
  on public.mentoring_offers (author_id, created_at desc);

create index profiles_directory_idx
  on public.profiles (batch_year, branch)
  where deleted_at is null
    and status = 'verified'
    and directory_opt_in = true;

create trigger mentoring_offers_updated_at
  before update on public.mentoring_offers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Protect inserts / status changes (same idea as photographs)
-- ---------------------------------------------------------------------------

create or replace function public.protect_offer()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      if new.author_id is distinct from auth.uid() then
        raise exception 'cannot post an offer as another person';
      end if;
      if new.status is distinct from 'pending' then
        raise exception 'offers must enter pending moderation';
      end if;
    end if;
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  if not public.is_moderator() then
    if new.status is distinct from old.status
       or new.moderator_id is distinct from old.moderator_id
       or new.moderated_at is distinct from old.moderated_at
       or new.author_id is distinct from old.author_id then
      if new.status = 'pending'
         and old.status = 'rejected'
         and old.author_id = auth.uid()
         and new.author_id = old.author_id then
        new.rejection_reason := null;
        return new;
      end if;
      if new.status = 'removed'
         and old.status in ('pending', 'approved', 'rejected')
         and new.deleted_at is not null
         and old.author_id = auth.uid()
         and new.author_id = old.author_id then
        return new;
      end if;
      raise exception 'only a moderator can change offer status';
    end if;
  else
    if new.status is distinct from old.status then
      new.moderator_id := auth.uid();
      new.moderated_at := now();
      if new.status = 'removed' and new.deleted_at is null then
        new.deleted_at := now();
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger mentoring_offers_protect
  before insert or update on public.mentoring_offers
  for each row
  execute function public.protect_offer();

create or replace function public.audit_offer_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.write_audit('offer.created', 'offer', new.id::text, jsonb_build_object(
      'kind', new.kind,
      'status', new.status
    ));
    return new;
  end if;
  if new.status is distinct from old.status then
    perform public.write_audit('offer.status', 'offer', new.id::text, jsonb_build_object(
      'from', old.status,
      'to', new.status
    ));
  end if;
  return new;
end;
$$;

create trigger mentoring_offers_audit
  after insert or update on public.mentoring_offers
  for each row
  execute function public.audit_offer_status();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.mentoring_offers enable row level security;
alter table public.mentoring_offers force row level security;

alter table public.mentoring_interest enable row level security;
alter table public.mentoring_interest force row level security;

grant select, insert, update on public.mentoring_offers to authenticated;
grant select on public.mentoring_offers to anon;
grant select, insert, delete on public.mentoring_interest to authenticated;

create policy offers_select_approved
  on public.mentoring_offers for select to anon, authenticated
  using (status = 'approved' and deleted_at is null);

create policy offers_select_own
  on public.mentoring_offers for select to authenticated
  using (author_id = auth.uid());

create policy offers_select_staff
  on public.mentoring_offers for select to authenticated
  using (public.is_moderator());

create policy offers_insert_verified
  on public.mentoring_offers for insert to authenticated
  with check (
    public.is_verified_member()
    and author_id = auth.uid()
    and status = 'pending'
    and deleted_at is null
  );

create policy offers_update_own
  on public.mentoring_offers for update to authenticated
  using (author_id = auth.uid() and status in ('pending', 'rejected'))
  with check (author_id = auth.uid());

create policy offers_update_staff
  on public.mentoring_offers for update to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

create policy interest_select_own
  on public.mentoring_interest for select to authenticated
  using (member_id = auth.uid());

create policy interest_select_author
  on public.mentoring_interest for select to authenticated
  using (
    exists (
      select 1 from public.mentoring_offers o
      where o.id = mentoring_interest.offer_id
        and o.author_id = auth.uid()
    )
  );

create policy interest_select_staff
  on public.mentoring_interest for select to authenticated
  using (public.is_moderator());

create policy interest_insert_verified
  on public.mentoring_interest for insert to authenticated
  with check (
    public.is_verified_member()
    and member_id = auth.uid()
    and exists (
      select 1 from public.mentoring_offers o
      where o.id = offer_id
        and o.status = 'approved'
        and o.deleted_at is null
        and o.author_id is distinct from auth.uid()
    )
  );

create policy interest_delete_own
  on public.mentoring_interest for delete to authenticated
  using (member_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Account deletion, export, and 90-day purge
-- ---------------------------------------------------------------------------

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  update public.photos
     set uploader_id = null,
         anonymised = true
   where uploader_id = uid;

  update public.articles
     set author_id = null,
         anonymised = true
   where author_id = uid;

  update public.comments
     set author_id = null,
         anonymised = true
   where author_id = uid;

  update public.mentoring_offers
     set author_id = null,
         anonymised = true
   where author_id = uid;

  delete from public.mentoring_interest where member_id = uid;

  update public.reports
     set reporter_id = null
   where reporter_id = uid;

  delete from public.reactions where user_id = uid;

  perform public.write_audit(
    'account.deleted',
    'profile',
    uid::text,
    '{}'::jsonb
  );

  delete from public.profiles where id = uid;
end;
$$;

create or replace function public.export_own_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  payload jsonb;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = uid),
    'photos', coalesce((
      select jsonb_agg(to_jsonb(ph) order by ph.created_at)
      from public.photos ph where ph.uploader_id = uid
    ), '[]'::jsonb),
    'articles', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.created_at)
      from public.articles a where a.author_id = uid
    ), '[]'::jsonb),
    'comments', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.created_at)
      from public.comments c where c.author_id = uid
    ), '[]'::jsonb),
    'reactions', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.created_at)
      from public.reactions r where r.user_id = uid
    ), '[]'::jsonb),
    'reports', coalesce((
      select jsonb_agg(to_jsonb(rp) order by rp.created_at)
      from public.reports rp where rp.reporter_id = uid
    ), '[]'::jsonb),
    'mentoring_offers', coalesce((
      select jsonb_agg(to_jsonb(o) order by o.created_at)
      from public.mentoring_offers o where o.author_id = uid
    ), '[]'::jsonb),
    'mentoring_interest', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.created_at)
      from public.mentoring_interest i where i.member_id = uid
    ), '[]'::jsonb)
  )
  into payload;

  return payload;
end;
$$;

create or replace function public.purge_expired_content()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  days integer;
  photos_n integer;
  articles_n integer;
  comments_n integer;
  offers_n integer;
begin
  select retention_days into days from public.settings where id = 1;
  days := coalesce(days, 90);

  with gone as (
    delete from public.photos
     where deleted_at is not null
       and deleted_at < now() - make_interval(days => days)
    returning id
  )
  select count(*) into photos_n from gone;

  with gone as (
    delete from public.articles
     where deleted_at is not null
       and deleted_at < now() - make_interval(days => days)
    returning id
  )
  select count(*) into articles_n from gone;

  with gone as (
    delete from public.comments
     where deleted_at is not null
       and deleted_at < now() - make_interval(days => days)
    returning id
  )
  select count(*) into comments_n from gone;

  with gone as (
    delete from public.mentoring_offers
     where deleted_at is not null
       and deleted_at < now() - make_interval(days => days)
    returning id
  )
  select count(*) into offers_n from gone;

  perform public.write_audit(
    'purge.expired',
    'system',
    null,
    jsonb_build_object(
      'photos', photos_n,
      'articles', articles_n,
      'comments', comments_n,
      'offers', offers_n,
      'retention_days', days
    )
  );

  return jsonb_build_object(
    'photos', photos_n,
    'articles', articles_n,
    'comments', comments_n,
    'offers', offers_n
  );
end;
$$;

update public.settings
   set feature_directory = true,
       feature_mentoring = true
 where id = 1;
