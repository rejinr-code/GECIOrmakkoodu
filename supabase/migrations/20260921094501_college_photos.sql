-- College photographs (faculty, office, campus events) are not tied to a
-- student batch. Courtesy is the name shown with the print.

alter table public.photos
  alter column batch_year drop not null;

alter table public.photos
  add column if not exists collection text not null default 'batch',
  add column if not exists courtesy text;

alter table public.photos
  drop constraint if exists photos_collection_check;
alter table public.photos
  add constraint photos_collection_check
    check (collection in ('batch', 'college'));

alter table public.photos
  drop constraint if exists photos_batch_or_college;
alter table public.photos
  add constraint photos_batch_or_college
    check (
      (collection = 'batch' and batch_year is not null)
      or (collection = 'college' and batch_year is null)
    );

alter table public.photos
  drop constraint if exists photos_courtesy_length;
alter table public.photos
  add constraint photos_courtesy_length
    check (
      courtesy is null
      or char_length(btrim(courtesy)) between 2 and 80
    );

comment on column public.photos.collection is
  'batch = a student year album. college = faculty, office, or campus photographs.';
comment on column public.photos.courtesy is
  'Name credited on the print. Null means credit the uploader.';

create index if not exists photos_college_created_idx
  on public.photos (created_at desc)
  where collection = 'college' and deleted_at is null and status = 'approved';

insert into public.event_tags (slug, label, sort_order, status)
values
  ('faculty', 'Faculty', 120, 'approved'),
  ('office', 'Office', 130, 'approved'),
  ('college-event', 'College event', 140, 'approved')
on conflict (slug) do nothing;

-- Batch representatives may add prints the same way admins do.
create policy photos_insert_staff
  on public.photos for insert to authenticated
  with check (
    public.is_moderator()
    and uploader_id = auth.uid()
    and status = 'pending'
    and licence_confirmed = true
    and deleted_at is null
  );
