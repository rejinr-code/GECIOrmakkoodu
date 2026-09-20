-- Ormakkoodu Phase 1 foundation: shared enumerations.
-- Content statuses keep a distinct "removed" value for soft-delete + 90-day purge.

create type public.user_role as enum ('member', 'moderator', 'admin');

create type public.user_status as enum (
  'pending',
  'verified',
  'rejected',
  'suspended'
);

create type public.content_status as enum (
  'pending',
  'approved',
  'rejected',
  'removed'
);

create type public.article_status as enum (
  'draft',
  'pending',
  'published',
  'rejected',
  'removed'
);

create type public.comment_status as enum ('visible', 'hidden', 'removed');

create type public.report_status as enum ('open', 'actioned', 'dismissed');

create type public.parent_kind as enum ('photo', 'article');

create type public.report_target as enum (
  'photo',
  'article',
  'comment',
  'profile'
);

create type public.rate_action as enum ('upload', 'comment');
