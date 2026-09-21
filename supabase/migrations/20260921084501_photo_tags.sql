-- Photographs may carry several tags. Members pick from the approved list
-- or propose a new label; new labels stay pending until a volunteer accepts them.

alter table public.event_tags
  add column if not exists status public.content_status not null default 'pending',
  add column if not exists created_by uuid references public.profiles (id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

alter table public.event_tags
  drop constraint if exists event_tags_slug_format;
alter table public.event_tags
  add constraint event_tags_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

alter table public.event_tags
  drop constraint if exists event_tags_label_length;
alter table public.event_tags
  add constraint event_tags_label_length
    check (char_length(btrim(label)) between 2 and 40);

-- Catalogue rows that already exist were curated; treat them as approved.
update public.event_tags
   set status = 'approved'
 where status = 'pending'
   and created_by is null;

create table if not exists public.photo_tags (
  photo_id uuid not null references public.photos (id) on delete cascade,
  tag_slug text not null references public.event_tags (slug) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id, tag_slug)
);

comment on table public.photo_tags is
  'Many tags per photograph. Public reads see approved tags on approved prints only.';

create index if not exists photo_tags_tag_slug_idx on public.photo_tags (tag_slug);

insert into public.photo_tags (photo_id, tag_slug)
select id, event_tag
  from public.photos
 where event_tag is not null
on conflict do nothing;

drop policy if exists event_tags_select_all on public.event_tags;

create policy event_tags_select_visible
  on public.event_tags for select to anon, authenticated
  using (
    status = 'approved'
    or created_by = auth.uid()
    or public.is_moderator()
  );

create policy event_tags_insert_verified
  on public.event_tags for insert to authenticated
  with check (
    public.is_verified_member()
    and created_by = auth.uid()
    and status = 'pending'
  );

create policy event_tags_update_staff
  on public.event_tags for update to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

alter table public.photo_tags enable row level security;
alter table public.photo_tags force row level security;

grant select on public.photo_tags to anon, authenticated;
grant insert, delete on public.photo_tags to authenticated;

create policy photo_tags_select
  on public.photo_tags for select to anon, authenticated
  using (
    exists (
      select 1
      from public.photos p
      join public.event_tags t on t.slug = photo_tags.tag_slug
      where p.id = photo_tags.photo_id
        and (
          (
            p.status = 'approved'
            and p.deleted_at is null
            and t.status = 'approved'
          )
          or p.uploader_id = auth.uid()
          or public.is_moderator()
        )
    )
  );

create policy photo_tags_insert
  on public.photo_tags for insert to authenticated
  with check (
    public.is_moderator()
    or (
      public.is_verified_member()
      and exists (
        select 1
        from public.photos p
        where p.id = photo_id
          and p.uploader_id = auth.uid()
          and p.status = 'pending'
          and p.deleted_at is null
      )
    )
  );

create policy photo_tags_delete
  on public.photo_tags for delete to authenticated
  using (
    public.is_moderator()
    or exists (
      select 1
      from public.photos p
      where p.id = photo_id
        and p.uploader_id = auth.uid()
        and p.status = 'pending'
    )
  );

create or replace function public.protect_event_tag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.created_by is null then
      new.created_by := auth.uid();
    end if;
    if not public.is_moderator() then
      new.status := 'pending';
      if coalesce(new.sort_order, 0) < 400 then
        new.sort_order := 400;
      end if;
    end if;
    return new;
  end if;

  if not public.is_moderator() then
    raise exception 'Only volunteers can change tags.';
  end if;
  new.slug := old.slug;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists event_tags_protect on public.event_tags;
create trigger event_tags_protect
  before insert or update on public.event_tags
  for each row
  execute function public.protect_event_tag();

create or replace function public.protect_photo_tag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tagged integer;
begin
  select count(*) into tagged
  from public.photo_tags
  where photo_id = new.photo_id;
  if tagged >= 8 then
    raise exception 'A photograph can carry at most eight tags.';
  end if;
  return new;
end;
$$;

drop trigger if exists photo_tags_protect on public.photo_tags;
create trigger photo_tags_protect
  before insert on public.photo_tags
  for each row
  execute function public.protect_photo_tag();

create or replace function public.propose_event_tag(p_label text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_label text;
  v_slug text;
  v_status public.content_status;
  existing public.event_tags%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in to add a tag.';
  end if;
  if not public.is_verified_member() then
    raise exception 'Verification comes first, then tags.';
  end if;

  v_label := btrim(regexp_replace(p_label, '\s+', ' ', 'g'));
  if char_length(v_label) < 2 then
    raise exception 'Give the tag a short name.';
  end if;
  if char_length(v_label) > 40 then
    raise exception 'Keep the tag under 40 characters.';
  end if;

  v_slug := trim(both '-' from lower(regexp_replace(v_label, '[^a-zA-Z0-9]+', '-', 'g')));
  if v_slug is null or char_length(v_slug) < 2 or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    v_slug := 'tag-' || substr(md5(lower(v_label)), 1, 10);
  end if;

  select * into existing
  from public.event_tags
  where slug = v_slug
     or lower(btrim(label)) = lower(v_label)
  order by
    case status
      when 'approved' then 0
      when 'pending' then 1
      else 2
    end,
    sort_order
  limit 1;

  if found then
    if existing.status = 'rejected' then
      raise exception 'That tag was not accepted.';
    end if;
    return existing.slug;
  end if;

  v_status := case when public.is_moderator() then 'approved' else 'pending' end;

  insert into public.event_tags (slug, label, sort_order, status, created_by)
  values (
    v_slug,
    v_label,
    case when v_status = 'approved' then 200 else 400 end,
    v_status,
    auth.uid()
  )
  on conflict (slug) do nothing;

  select * into existing from public.event_tags where slug = v_slug;
  if not found or existing.status = 'rejected' then
    raise exception 'That tag was not accepted.';
  end if;
  return existing.slug;
end;
$$;

revoke all on function public.propose_event_tag(text) from public;
grant execute on function public.propose_event_tag(text) to authenticated;
