-- Custom access token hook: copy role + status onto the JWT.
-- Local: enabled in supabase/config.toml.
-- Hosted: Authentication → Hooks → Custom Access Token → this function.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role text;
  user_status text;
begin
  select p.role::text, p.status::text
    into user_role, user_status
  from public.profiles p
  where p.id = (event ->> 'user_id')::uuid
    and p.deleted_at is null;

  claims := event -> 'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(user_role, 'member')));
  claims := jsonb_set(claims, '{user_status}', to_jsonb(coalesce(user_status, 'pending')));

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute
  on function public.custom_access_token_hook(jsonb)
  to supabase_auth_admin;
grant select on table public.profiles to supabase_auth_admin;

revoke execute
  on function public.custom_access_token_hook(jsonb)
  from public, anon, authenticated;
