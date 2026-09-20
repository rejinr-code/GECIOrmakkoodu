-- Turn on photograph likes and comments. Comments stay post-moderated:
-- they appear immediately, members may flag them, staff may remove them.

update public.settings
set feature_comments = true
where id = 1;

alter table public.comments
  add constraint comments_body_length_check
  check (char_length(body) <= 800);

alter table public.reports
  add constraint reports_reason_length_check
  check (char_length(reason) <= 280);

create unique index if not exists reports_open_once_idx
  on public.reports (reporter_id, target_type, target_id)
  where status = 'open';

-- Staff may hide or remove; account deletion may anonymise. Nobody else
-- rewrites a comment body or parent through this trigger.
create or replace function public.protect_comment()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_ok boolean := false;
begin
  if tg_op = 'INSERT' then
    if exists (select 1 from public.settings s where s.id = 1 and s.feature_comments is not true) then
      raise exception 'comments are turned off';
    end if;

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

    return new;
  end if;

  -- UPDATE
  if new.anonymised is true and new.author_id is null then
    new.parent_type := old.parent_type;
    new.parent_id := old.parent_id;
    new.body := old.body;
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  if not public.is_moderator() then
    raise exception 'only a moderator can change a comment';
  end if;

  new.parent_type := old.parent_type;
  new.parent_id := old.parent_id;
  new.author_id := old.author_id;
  new.body := old.body;

  if new.status is distinct from old.status and new.status = 'removed' then
    new.deleted_at := coalesce(new.deleted_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists comments_protect on public.comments;
create trigger comments_protect
  before insert or update on public.comments
  for each row
  execute function public.protect_comment();

create or replace function public.audit_comment_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    perform public.write_audit(
      'comment.status',
      'comment',
      new.id::text,
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists comments_audit on public.comments;
create trigger comments_audit
  after update of status on public.comments
  for each row
  execute function public.audit_comment_status();

create or replace function public.protect_reaction()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_ok boolean := false;
begin
  if exists (select 1 from public.settings s where s.id = 1 and s.feature_comments is not true) then
    raise exception 'likes are turned off';
  end if;

  if auth.uid() is not null and new.user_id is distinct from auth.uid() then
    raise exception 'cannot react as another person';
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
    raise exception 'cannot react to unpublished or missing content';
  end if;

  return new;
end;
$$;

drop trigger if exists reactions_protect on public.reactions;
create trigger reactions_protect
  before insert on public.reactions
  for each row
  execute function public.protect_reaction();
