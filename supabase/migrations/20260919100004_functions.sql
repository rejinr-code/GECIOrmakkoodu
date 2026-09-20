-- JWT helpers, triggers, rate limits, audit, account deletion, purge.
-- Helper functions that read auth.jwt() are INVOKER so they see the caller's token.

create or replace function public.jwt_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'user_role', '');
$$;

create or replace function public.jwt_status()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'user_status', '');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.jwt_role() = 'admin';
$$;

create or replace function public.is_moderator()
returns boolean
language sql
stable
as $$
  select public.jwt_role() in ('moderator', 'admin');
$$;

create or replace function public.is_verified_member()
returns boolean
language sql
stable
as $$
  select
    auth.uid() is not null
    and public.jwt_status() = 'verified'
    and public.jwt_role() in ('member', 'moderator', 'admin');
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.write_audit(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_detail jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, action, target_type, target_id, detail)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_detail, '{}'::jsonb));
end;
$$;

create or replace function public.under_daily_limit(p_action public.rate_action)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  limit_n integer;
  used_n integer;
begin
  if p_action = 'upload' then
    select s.upload_limit_per_day into limit_n from public.settings s where s.id = 1;
    select count(*) into used_n
    from public.photos p
    where p.uploader_id = auth.uid()
      and (p.created_at at time zone 'Asia/Kolkata')::date
        = (now() at time zone 'Asia/Kolkata')::date;
  elsif p_action = 'comment' then
    select s.comment_limit_per_day into limit_n from public.settings s where s.id = 1;
    select count(*) into used_n
    from public.comments c
    where c.author_id = auth.uid()
      and (c.created_at at time zone 'Asia/Kolkata')::date
        = (now() at time zone 'Asia/Kolkata')::date;
  else
    return false;
  end if;

  return coalesce(used_n, 0) < coalesce(limit_n, 0);
end;
$$;

-- ---------------------------------------------------------------------------
-- Auth → profile
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  batch integer;
begin
  if meta ? 'batch_year' and (meta ->> 'batch_year') ~ '^[0-9]+$' then
    batch := (meta ->> 'batch_year')::integer;
  end if;

  insert into public.profiles (
    id,
    name,
    batch_year,
    branch,
    phone,
    consent_accepted_at,
    consent_version,
    role,
    status
  )
  values (
    new.id,
    coalesce(nullif(trim(meta ->> 'name'), ''), split_part(new.email, '@', 1), 'Alumnus'),
    batch,
    nullif(trim(meta ->> 'branch'), ''),
    nullif(trim(meta ->> 'phone'), ''),
    case
      when meta ? 'consent_accepted_at' then (meta ->> 'consent_accepted_at')::timestamptz
      when coalesce(meta ->> 'consent', '') in ('true', '1') then now()
      else null
    end,
    nullif(trim(meta ->> 'consent_version'), ''),
    'member',
    'pending'
  );

  perform public.write_audit(
    'profile.created',
    'profile',
    new.id::text,
    jsonb_build_object('email_domain', split_part(new.email, '@', 2))
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Profile protections
-- ---------------------------------------------------------------------------

create or replace function public.protect_profile()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'verified' then
    if new.name is null or length(trim(new.name)) = 0
       or new.batch_year is null
       or new.branch is null
       or new.consent_accepted_at is null
       or new.consent_version is null then
      raise exception 'cannot verify an incomplete profile'
        using errcode = 'P0001';
    end if;
  end if;

  -- Service role / seeder (no JWT) may write anything.
  if auth.uid() is null then
    return new;
  end if;

  if not public.is_admin() then
    new.role := old.role;
    if new.status is distinct from old.status then
      raise exception 'only an admin can change verification status'
        using errcode = 'P0001';
    end if;
  end if;

  if new.id is distinct from old.id then
    raise exception 'profile id cannot change';
  end if;

  return new;
end;
$$;

create trigger profiles_protect
  before update on public.profiles
  for each row
  execute function public.protect_profile();

create or replace function public.audit_profile_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status or new.role is distinct from old.role then
    perform public.write_audit(
      'profile.status',
      'profile',
      new.id::text,
      jsonb_build_object(
        'from_status', old.status,
        'to_status', new.status,
        'from_role', old.role,
        'to_role', new.role
      )
    );
  end if;
  return new;
end;
$$;

create trigger profiles_audit_status
  after update of role, status on public.profiles
  for each row
  execute function public.audit_profile_status();

-- ---------------------------------------------------------------------------
-- Photos: nothing is born approved; only moderators change status
-- ---------------------------------------------------------------------------

create or replace function public.protect_photo()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      if new.uploader_id is distinct from auth.uid() then
        raise exception 'cannot upload as another person';
      end if;
      if new.status is distinct from 'pending' then
        raise exception 'uploads must enter pending moderation';
      end if;
    end if;
    if new.licence_confirmed is not true then
      raise exception 'licence confirmation is required';
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
       or new.rejection_reason is distinct from old.rejection_reason
       or new.uploader_id is distinct from old.uploader_id
       or new.storage_key is distinct from old.storage_key
       or new.thumb_key is distinct from old.thumb_key
       or new.licence_confirmed is distinct from old.licence_confirmed
       or new.bytes is distinct from old.bytes
       or new.width is distinct from old.width
       or new.height is distinct from old.height then
      if new.status = 'removed'
         and old.status in ('pending', 'approved', 'rejected')
         and new.deleted_at is not null
         and old.uploader_id = auth.uid()
         and new.uploader_id = old.uploader_id
         and new.storage_key = old.storage_key then
        return new;
      end if;
      raise exception 'only a moderator can change photo status or storage metadata';
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

create trigger photos_protect
  before insert or update on public.photos
  for each row
  execute function public.protect_photo();

create or replace function public.audit_photo_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.write_audit('photo.uploaded', 'photo', new.id::text, jsonb_build_object(
      'batch_year', new.batch_year
    ));
    return new;
  end if;
  if new.status is distinct from old.status then
    perform public.write_audit('photo.status', 'photo', new.id::text, jsonb_build_object(
      'from', old.status,
      'to', new.status,
      'reason', new.rejection_reason
    ));
  end if;
  return new;
end;
$$;

create trigger photos_audit
  after insert or update of status on public.photos
  for each row
  execute function public.audit_photo_status();

-- ---------------------------------------------------------------------------
-- Articles
-- ---------------------------------------------------------------------------

create or replace function public.protect_article()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      if new.author_id is distinct from auth.uid() then
        raise exception 'cannot author as another person';
      end if;
      if new.status not in ('draft', 'pending') then
        raise exception 'articles must be created as draft or pending';
      end if;
    end if;
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  if not public.is_moderator() then
    if old.status = 'published' and new.status is distinct from old.status then
      if new.status = 'removed' and old.author_id = auth.uid() then
        new.deleted_at := coalesce(new.deleted_at, now());
        return new;
      end if;
      raise exception 'only a moderator can change a published article''s status';
    end if;
    if new.status in ('published', 'rejected') and old.status is distinct from new.status then
      raise exception 'only a moderator can publish or reject an article';
    end if;
    if new.author_id is distinct from old.author_id then
      raise exception 'cannot reassign authorship';
    end if;
  else
    if new.status is distinct from old.status then
      new.moderator_id := auth.uid();
      new.moderated_at := now();
      if new.status = 'published' then
        new.published_at := coalesce(new.published_at, now());
      end if;
      if new.status = 'removed' and new.deleted_at is null then
        new.deleted_at := now();
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger articles_protect
  before insert or update on public.articles
  for each row
  execute function public.protect_article();

create or replace function public.audit_article_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.write_audit('article.created', 'article', new.id::text, jsonb_build_object(
      'status', new.status
    ));
    return new;
  end if;
  if new.status is distinct from old.status then
    perform public.write_audit('article.status', 'article', new.id::text, jsonb_build_object(
      'from', old.status,
      'to', new.status
    ));
  end if;
  return new;
end;
$$;

create trigger articles_audit
  after insert or update of status on public.articles
  for each row
  execute function public.audit_article_status();

-- ---------------------------------------------------------------------------
-- Comments: parent must exist and be publicly visible (or owned)
-- ---------------------------------------------------------------------------

create or replace function public.protect_comment()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_ok boolean := false;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and new.author_id is distinct from auth.uid() then
      raise exception 'cannot comment as another person';
    end if;

    if new.parent_type = 'photo' then
      select exists (
        select 1 from public.photos p
        where p.id = new.parent_id
          and p.deleted_at is null
          and p.status = 'approved'
      ) into parent_ok;
    elsif new.parent_type = 'article' then
      select exists (
        select 1 from public.articles a
        where a.id = new.parent_id
          and a.deleted_at is null
          and a.status = 'published'
      ) into parent_ok;
    end if;

    if not parent_ok then
      raise exception 'cannot comment on unpublished or missing content';
    end if;
  end if;

  return new;
end;
$$;

create trigger comments_protect
  before insert on public.comments
  for each row
  execute function public.protect_comment();

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger photos_updated_at
  before update on public.photos
  for each row execute function public.set_updated_at();

create trigger articles_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

create trigger comments_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

create trigger reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

create trigger legal_updated_at
  before update on public.legal_documents
  for each row execute function public.set_updated_at();

create trigger batch_groups_updated_at
  before update on public.batch_groups
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Account deletion: anonymise contributions, remove the profile.
-- Auth user deletion is completed by the Admin API (see scripts / app).
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

-- ---------------------------------------------------------------------------
-- Own-data export (compliance)
-- ---------------------------------------------------------------------------

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
    ), '[]'::jsonb)
  )
  into payload;

  return payload;
end;
$$;

-- ---------------------------------------------------------------------------
-- Soft-delete purge (90 days). Called by the scheduled Edge Function.
-- ---------------------------------------------------------------------------

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

  perform public.write_audit(
    'purge.expired',
    'system',
    null,
    jsonb_build_object(
      'photos', photos_n,
      'articles', articles_n,
      'comments', comments_n,
      'retention_days', days
    )
  );

  return jsonb_build_object(
    'photos', photos_n,
    'articles', articles_n,
    'comments', comments_n
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin storage ceiling
-- ---------------------------------------------------------------------------

create or replace function public.admin_storage_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  stats jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  select jsonb_build_object(
    'photo_bytes', coalesce(sum(bytes) filter (where deleted_at is null), 0),
    'photo_count', count(*) filter (where deleted_at is null),
    'pending_count', count(*) filter (where status = 'pending' and deleted_at is null),
    'approved_count', count(*) filter (where status = 'approved' and deleted_at is null),
    'free_tier_bytes', 1073741824
  )
  into stats
  from public.photos;

  return stats;
end;
$$;

create or replace function public.current_prompt()
returns setof public.monthly_prompts
language sql
stable
as $$
  select *
  from public.monthly_prompts
  where starts_at <= now()
    and (ends_at is null or ends_at >= now())
  order by starts_at desc
  limit 1;
$$;
