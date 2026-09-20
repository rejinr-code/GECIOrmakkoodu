-- Staff checks must follow the profiles table, not only JWT claims.
-- Hosted Auth may not have custom_access_token_hook enabled, which left
-- admins able to open /admin while RLS hid every other pending member.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and deleted_at is null
  );
$$;

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('moderator', 'admin')
      and deleted_at is null
  );
$$;

create or replace function public.is_verified_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'verified'
      and role in ('member', 'moderator', 'admin')
      and deleted_at is null
  );
$$;
