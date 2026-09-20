-- Authorisation lives here. The anon key is public; these policies are the boundary.
--
-- JWT claims (set by custom_access_token_hook):
--   user_role   member | moderator | admin
--   user_status pending | verified | rejected | suspended
--
-- Guest = the anon role (no JWT). Guests read approved/published rows only.
-- Pending members browse like guests and cannot insert content.

-- ---------------------------------------------------------------------------
-- Safe public projections (no phone, no WhatsApp, no coordinator contact)
-- Views run as the owner so they can project columns the client cannot GRANT.
-- ---------------------------------------------------------------------------

create or replace view public.public_profiles
with (security_invoker = false)
as
select
  id,
  name,
  batch_year,
  branch,
  avatar_url,
  bio,
  current_city,
  "current_role",
  created_at
from public.profiles
where status = 'verified'
  and deleted_at is null;

create or replace view public.batch_groups_public
with (security_invoker = false)
as
select batch_year, branch, coordinator_name
from public.batch_groups;

comment on view public.public_profiles is
  'Verified alumni, public columns only. Phone and email never appear here.';
comment on view public.batch_groups_public is
  'Batch listing without invite URLs or private contact.';

-- ---------------------------------------------------------------------------
-- Enable + force RLS on every table. No client path around these policies.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

alter table public.alumni_register enable row level security;
alter table public.alumni_register force row level security;

alter table public.settings enable row level security;
alter table public.settings force row level security;

alter table public.legal_documents enable row level security;
alter table public.legal_documents force row level security;

alter table public.event_tags enable row level security;
alter table public.event_tags force row level security;

alter table public.batch_groups enable row level security;
alter table public.batch_groups force row level security;

alter table public.photos enable row level security;
alter table public.photos force row level security;

alter table public.articles enable row level security;
alter table public.articles force row level security;

alter table public.comments enable row level security;
alter table public.comments force row level security;

alter table public.reactions enable row level security;
alter table public.reactions force row level security;

alter table public.reports enable row level security;
alter table public.reports force row level security;

alter table public.monthly_prompts enable row level security;
alter table public.monthly_prompts force row level security;

alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;

-- ---------------------------------------------------------------------------
-- Table grants. Column grants keep phone off anon/authenticated except own row
-- via a dedicated policy + grant of all columns to authenticated (RLS: own or staff).
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

grant select on public.public_profiles to anon, authenticated;
grant select on public.batch_groups_public to anon, authenticated;

grant select on public.settings to anon, authenticated;
grant update on public.settings to authenticated;

grant select on public.legal_documents to anon, authenticated;
grant insert, update on public.legal_documents to authenticated;

grant select on public.event_tags to anon, authenticated;
grant insert, update, delete on public.event_tags to authenticated;

grant select on public.photos to anon, authenticated;
grant insert, update on public.photos to authenticated;

grant select on public.articles to anon, authenticated;
grant insert, update on public.articles to authenticated;

grant select on public.comments to anon, authenticated;
grant insert, update on public.comments to authenticated;

grant select on public.reactions to anon, authenticated;
grant insert, update, delete on public.reactions to authenticated;

grant select on public.monthly_prompts to anon, authenticated;
grant insert, update, delete on public.monthly_prompts to authenticated;

grant select, update on public.profiles to authenticated;

grant select, insert, update, delete on public.batch_groups to authenticated;

grant select, insert, update on public.reports to authenticated;

grant select, insert, update, delete on public.alumni_register to authenticated;

grant select on public.audit_log to authenticated;

grant execute on function public.jwt_role() to anon, authenticated;
grant execute on function public.jwt_status() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_moderator() to anon, authenticated;
grant execute on function public.is_verified_member() to anon, authenticated;
grant execute on function public.under_daily_limit(public.rate_action) to authenticated;
grant execute on function public.delete_own_account() to authenticated;
grant execute on function public.export_own_data() to authenticated;
grant execute on function public.admin_storage_stats() to authenticated;
grant execute on function public.current_prompt() to anon, authenticated;

revoke execute on function public.purge_expired_content() from public, anon, authenticated;
grant execute on function public.purge_expired_content() to service_role;

revoke execute on function public.write_audit(text, text, text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy profiles_select_self
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy profiles_select_staff
  on public.profiles for select to authenticated
  using (public.is_moderator());

create policy profiles_update_self
  on public.profiles for update to authenticated
  using (id = auth.uid() and deleted_at is null)
  with check (id = auth.uid());

create policy profiles_update_admin
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------------

create policy photos_select_approved
  on public.photos for select to anon, authenticated
  using (status = 'approved' and deleted_at is null);

create policy photos_select_own
  on public.photos for select to authenticated
  using (uploader_id = auth.uid());

create policy photos_select_staff
  on public.photos for select to authenticated
  using (public.is_moderator());

create policy photos_insert_verified
  on public.photos for insert to authenticated
  with check (
    public.is_verified_member()
    and uploader_id = auth.uid()
    and status = 'pending'
    and licence_confirmed = true
    and deleted_at is null
    and public.under_daily_limit('upload')
  );

create policy photos_update_own
  on public.photos for update to authenticated
  using (uploader_id = auth.uid())
  with check (uploader_id = auth.uid());

create policy photos_update_staff
  on public.photos for update to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

-- ---------------------------------------------------------------------------
-- articles
-- ---------------------------------------------------------------------------

create policy articles_select_published
  on public.articles for select to anon, authenticated
  using (status = 'published' and deleted_at is null);

create policy articles_select_own
  on public.articles for select to authenticated
  using (author_id = auth.uid());

create policy articles_select_staff
  on public.articles for select to authenticated
  using (public.is_moderator());

create policy articles_insert_verified
  on public.articles for insert to authenticated
  with check (
    public.is_verified_member()
    and author_id = auth.uid()
    and status in ('draft', 'pending')
    and deleted_at is null
  );

create policy articles_update_own
  on public.articles for update to authenticated
  using (author_id = auth.uid() and status in ('draft', 'pending', 'published'))
  with check (author_id = auth.uid());

create policy articles_update_staff
  on public.articles for update to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

-- ---------------------------------------------------------------------------
-- comments (post-moderated: inserted visible, staff may hide)
-- ---------------------------------------------------------------------------

create policy comments_select_visible
  on public.comments for select to anon, authenticated
  using (
    status = 'visible'
    and deleted_at is null
    and (
      (
        parent_type = 'photo'
        and exists (
          select 1 from public.photos p
          where p.id = comments.parent_id
            and p.status = 'approved'
            and p.deleted_at is null
        )
      )
      or (
        parent_type = 'article'
        and exists (
          select 1 from public.articles a
          where a.id = comments.parent_id
            and a.status = 'published'
            and a.deleted_at is null
        )
      )
    )
  );

create policy comments_select_own
  on public.comments for select to authenticated
  using (author_id = auth.uid());

create policy comments_select_staff
  on public.comments for select to authenticated
  using (public.is_moderator());

create policy comments_insert_verified
  on public.comments for insert to authenticated
  with check (
    public.is_verified_member()
    and author_id = auth.uid()
    and status = 'visible'
    and deleted_at is null
    and public.under_daily_limit('comment')
  );

create policy comments_update_staff
  on public.comments for update to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

-- ---------------------------------------------------------------------------
-- reactions — single "remember this". Own row may be deleted to toggle off.
-- ---------------------------------------------------------------------------

create policy reactions_select_active
  on public.reactions for select to anon, authenticated
  using (deleted_at is null);

create policy reactions_select_own
  on public.reactions for select to authenticated
  using (user_id = auth.uid());

create policy reactions_insert_verified
  on public.reactions for insert to authenticated
  with check (
    public.is_verified_member()
    and user_id = auth.uid()
    and deleted_at is null
  );

create policy reactions_delete_own
  on public.reactions for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- reports — any signed-in person, including pending, may report
-- ---------------------------------------------------------------------------

create policy reports_insert_authenticated
  on public.reports for insert to authenticated
  with check (
    auth.uid() is not null
    and reporter_id = auth.uid()
    and status = 'open'
  );

create policy reports_select_own
  on public.reports for select to authenticated
  using (reporter_id = auth.uid());

create policy reports_select_staff
  on public.reports for select to authenticated
  using (public.is_moderator());

create policy reports_update_staff
  on public.reports for update to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

-- ---------------------------------------------------------------------------
-- batch groups, settings, legal, tags, register, prompts, audit
-- ---------------------------------------------------------------------------

create policy batch_groups_select_verified
  on public.batch_groups for select to authenticated
  using (public.is_verified_member() or public.is_moderator());

create policy batch_groups_write_admin
  on public.batch_groups for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy settings_select_all
  on public.settings for select to anon, authenticated
  using (true);

create policy settings_update_admin
  on public.settings for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy legal_select_all
  on public.legal_documents for select to anon, authenticated
  using (true);

create policy legal_write_admin
  on public.legal_documents for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy event_tags_select_all
  on public.event_tags for select to anon, authenticated
  using (true);

create policy event_tags_write_admin
  on public.event_tags for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy alumni_register_admin
  on public.alumni_register for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy monthly_prompts_select_all
  on public.monthly_prompts for select to anon, authenticated
  using (true);

create policy monthly_prompts_write_admin
  on public.monthly_prompts for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy audit_log_select_admin
  on public.audit_log for select to authenticated
  using (public.is_admin());

-- Intentionally no insert/update/delete policies on audit_log.
-- Direct client writes fail. Triggers write via security definer.
