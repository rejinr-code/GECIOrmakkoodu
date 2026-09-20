-- Core tables. Image bytes are never stored here — only storage keys and metadata.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  batch_year integer
    check (
      batch_year is null
      or (batch_year >= 2000 and batch_year <= extract(year from now())::integer + 1)
    ),
  branch text,
  phone text,
  avatar_url text,
  role public.user_role not null default 'member',
  status public.user_status not null default 'pending',
  bio text,
  current_city text,
  current_role text,
  consent_accepted_at timestamptz,
  consent_version text,
  directory_opt_in boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.phone is
  'Private contact for verification only. Never listed publicly.';
comment on column public.profiles.directory_opt_in is
  'Phase 4 directory. Unused until that phase ships.';

create table public.alumni_register (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  batch_year integer not null check (batch_year >= 2000),
  branch text not null,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

comment on table public.alumni_register is
  'Reference list for human verification. Never exposed to members or guests.';

create table public.settings (
  id integer primary key default 1 check (id = 1),
  site_name text not null,
  tagline text not null,
  association_name text not null,
  moderation_photos boolean not null default true,
  moderation_articles boolean not null default true,
  moderation_comments boolean not null default false,
  contact_email text not null,
  consent_version text not null,
  feature_photos boolean not null default true,
  feature_articles boolean not null default true,
  feature_comments boolean not null default false,
  feature_directory boolean not null default false,
  feature_mentoring boolean not null default false,
  feature_monthly_prompt boolean not null default false,
  upload_limit_per_day integer not null default 20
    check (upload_limit_per_day > 0),
  comment_limit_per_day integer not null default 50
    check (comment_limit_per_day > 0),
  retention_days integer not null default 90 check (retention_days > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create table public.legal_documents (
  slug text primary key,
  title text not null,
  body_markdown text not null,
  version text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create table public.event_tags (
  slug text primary key,
  label text not null,
  sort_order integer not null default 0
);

create table public.batch_groups (
  batch_year integer not null check (batch_year >= 2000),
  branch text not null,
  whatsapp_invite_url text,
  coordinator_name text,
  coordinator_contact text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  primary key (batch_year, branch)
);

comment on column public.batch_groups.coordinator_contact is
  'Visible to verified members only. Never shown to guests.';
comment on column public.batch_groups.whatsapp_invite_url is
  'Visible to verified members only.';

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid references public.profiles (id) on delete set null,
  storage_key text not null,
  thumb_key text not null,
  caption text,
  alt_text text not null check (char_length(trim(alt_text)) > 0),
  batch_year integer not null check (batch_year >= 2000),
  event_tag text references public.event_tags (slug),
  people_tagged text[] not null default '{}',
  status public.content_status not null default 'pending',
  moderator_id uuid references public.profiles (id) on delete set null,
  moderated_at timestamptz,
  rejection_reason text,
  licence_confirmed boolean not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  bytes integer not null check (bytes > 0),
  anonymised boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint photos_licence_must_be_true check (licence_confirmed = true)
);

comment on column public.photos.people_tagged is
  'Free-text names typed by the uploader. Face recognition is permanently out of scope.';
comment on column public.photos.storage_key is
  'Object key in the photos bucket. Never store image bytes in Postgres.';
comment on column public.photos.thumb_key is
  'Object key in the thumbs bucket (400px longest edge, produced in the browser).';

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  body text not null default '',
  cover_photo_id uuid references public.photos (id) on delete set null,
  batch_year integer check (batch_year is null or batch_year >= 2000),
  status public.article_status not null default 'draft',
  published_at timestamptz,
  rejection_reason text,
  moderator_id uuid references public.profiles (id) on delete set null,
  moderated_at timestamptz,
  anonymised boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  parent_type public.parent_kind not null,
  parent_id uuid not null,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(trim(body)) > 0),
  status public.comment_status not null default 'visible',
  anonymised boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  parent_type public.parent_kind not null,
  parent_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type public.report_target not null,
  target_id uuid not null,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason text not null check (char_length(trim(reason)) > 0),
  status public.report_status not null default 'open',
  handled_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.monthly_prompts (
  id uuid primary key default gen_random_uuid(),
  theme text not null,
  body text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_log is
  'Append-only. No update or delete policy for anyone, including admins.';
