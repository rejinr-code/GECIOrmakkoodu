-- Private buckets. Nothing is publicly readable by path-guessing.
-- Signed URLs are minted in src/lib/imageStore.ts after a photos-table check.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'photos',
    'photos',
    false,
    5242880,
    array['image/webp']::text[]
  ),
  (
    'thumbs',
    'thumbs',
    false,
    1048576,
    array['image/webp']::text[]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Object keys: {userId}/{photoId}/original.webp  and  {userId}/{photoId}/thumb.webp

create policy storage_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('photos', 'thumbs')
    and public.is_verified_member()
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy storage_select_own
  on storage.objects for select to authenticated
  using (
    bucket_id in ('photos', 'thumbs')
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy storage_select_staff
  on storage.objects for select to authenticated
  using (
    bucket_id in ('photos', 'thumbs')
    and public.is_moderator()
  );

create policy storage_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('photos', 'thumbs')
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy storage_delete_staff
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('photos', 'thumbs')
    and public.is_moderator()
  );

-- No public (anon) SELECT on storage.objects.
-- Guests receive signed URLs only for approved photos, via imageStore.
