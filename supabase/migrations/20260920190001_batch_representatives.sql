-- Batch representatives (moderators) may verify alumni in their own
-- batch and branch. Admins still verify anyone and still assign roles.

create or replace function public.protect_profile()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  staff_year integer;
  staff_branch text;
  next_status public.user_status;
begin
  if new.status = 'verified' then
    if new.name is null or length(trim(new.name)) = 0
       or new.batch_year is null
       or new.branch is null
       or new.consent_accepted_at is null
       or new.consent_version is null then
      raise exception 'cannot verify an incomplete profile'
        using errcode = 'P0001';
    end if;
  end if;

  -- Service role / seeder (no JWT) may write anything.
  if auth.uid() is null then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'profile id cannot change';
  end if;

  if public.is_admin() then
    return new;
  end if;

  if public.is_moderator()
     and new.id is distinct from auth.uid()
     and new.status is distinct from old.status then
    select batch_year, branch
      into staff_year, staff_branch
      from public.profiles
     where id = auth.uid();

    if old.batch_year is distinct from staff_year
       or old.branch is distinct from staff_branch then
      raise exception 'moderators can only verify their own batch and branch'
        using errcode = 'P0001';
    end if;

    if new.status not in ('verified', 'rejected') then
      raise exception 'moderators can only verify or reject'
        using errcode = 'P0001';
    end if;

    next_status := new.status;
    new := old;
    new.status := next_status;
    new.updated_at := now();
    return new;
  end if;

  if public.is_moderator() and new.id is distinct from auth.uid() then
    raise exception 'moderators can only verify or reject'
      using errcode = 'P0001';
  end if;

  new.role := old.role;
  if new.status is distinct from old.status then
    raise exception 'only an admin or batch representative can change verification status'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop policy if exists profiles_update_moderator on public.profiles;
create policy profiles_update_moderator
  on public.profiles for update to authenticated
  using (
    public.is_moderator()
    and id is distinct from auth.uid()
    and batch_year = (select p.batch_year from public.profiles p where p.id = auth.uid())
    and branch = (select p.branch from public.profiles p where p.id = auth.uid())
  )
  with check (
    public.is_moderator()
    and status in ('verified', 'rejected')
  );

drop policy if exists alumni_register_select_moderator on public.alumni_register;
create policy alumni_register_select_moderator
  on public.alumni_register for select to authenticated
  using (
    public.is_moderator()
    and batch_year = (select p.batch_year from public.profiles p where p.id = auth.uid())
    and branch = (select p.branch from public.profiles p where p.id = auth.uid())
  );
