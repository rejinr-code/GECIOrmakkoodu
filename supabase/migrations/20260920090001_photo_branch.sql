-- Photos belong to a batch year first. Branch is an optional page inside that album,
-- so campus-wide pictures can sit in the whole-batch view.

alter table public.photos
  add column branch text
  check (
    branch is null
    or branch in ('CSE', 'ECE', 'EEE', 'IT', 'ME', 'RAI')
  );

comment on column public.photos.branch is
  'Department page inside a batch album. Null means a campus-wide picture in the whole-batch view.';

create index photos_batch_branch_idx
  on public.photos (batch_year, branch)
  where deleted_at is null and status = 'approved';
