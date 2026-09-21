-- New tags always wait, even when a volunteer proposes them at upload.
create or replace function public.propose_event_tag(p_label text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_label text;
  v_slug text;
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

  insert into public.event_tags (slug, label, sort_order, status, created_by)
  values (v_slug, v_label, 400, 'pending', auth.uid())
  on conflict (slug) do nothing;

  select * into existing from public.event_tags where slug = v_slug;
  if not found or existing.status = 'rejected' then
    raise exception 'That tag was not accepted.';
  end if;
  return existing.slug;
end;
$$;
