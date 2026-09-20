-- Browse-by-year is the primary access path. Status filters sit beside it.

create index photos_batch_status_created_idx
  on public.photos (batch_year, status, created_at desc);

create index photos_status_created_idx
  on public.photos (status, created_at desc)
  where deleted_at is null;

create index photos_uploader_idx
  on public.photos (uploader_id, created_at desc);

create index articles_status_published_idx
  on public.articles (status, published_at desc)
  where deleted_at is null;

create index articles_author_idx
  on public.articles (author_id, created_at desc);

create index articles_batch_idx
  on public.articles (batch_year, status);

create index comments_parent_idx
  on public.comments (parent_type, parent_id, created_at);

create index reactions_parent_idx
  on public.reactions (parent_type, parent_id)
  where deleted_at is null;

create unique index reactions_one_per_user_idx
  on public.reactions (user_id, parent_type, parent_id)
  where deleted_at is null;

create index reports_status_created_idx
  on public.reports (status, created_at desc);

create index reports_target_idx
  on public.reports (target_type, target_id);

create index profiles_status_idx
  on public.profiles (status)
  where deleted_at is null;

create index profiles_batch_branch_idx
  on public.profiles (batch_year, branch)
  where deleted_at is null;

create index alumni_register_lookup_idx
  on public.alumni_register (batch_year, branch, lower(name));

create index monthly_prompts_window_idx
  on public.monthly_prompts (starts_at desc, ends_at);

-- Search covers captions, tagged names, and article text (Phase 2/3).
alter table public.photos
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(caption, '')), 'A')
    || setweight(
      to_tsvector('simple', coalesce(array_to_string(people_tagged, ' '), '')),
      'B'
    )
  ) stored;

create index photos_search_idx on public.photos using gin (search_vector);

alter table public.articles
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(body, '')), 'B')
  ) stored;

create index articles_search_idx on public.articles using gin (search_vector);

alter table public.profiles
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A')
  ) stored;

create index profiles_search_idx on public.profiles using gin (search_vector);
