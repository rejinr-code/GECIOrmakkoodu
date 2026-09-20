# Ormakkoodu

ഓർമ്മക്കൂട് — *a nest of memories*. The GECIAN archive.

A photograph and writing archive run by **GECIAN**, the alumni association of Government Engineering College Idukki, Kerala. It is built and operated by alumni volunteers. **Government Engineering College Idukki has no ownership, role, or responsibility for this project.**

This repository is meant to be handed from one volunteer to the next. You should be able to clone it, create your own Supabase project, run the migrations, and go live on Vercel without knowing the previous operator.

Phase 1 is in progress: public wall, join/sign-in, legal pages, batch groups, and the admin verification queue. Photograph upload is Phase 2.

## What you need

- Node.js 20 or newer
- A free [Supabase](https://supabase.com) project
- A free [Vercel](https://vercel.com) account
- Docker Desktop, only if you want to run Supabase locally
- A GitHub repository, so the daily keep-alive workflow can run

No paid add-ons. Auth is **email magic link** plus optional **Google**. Phone OTP is not used — Supabase would need a paid SMS provider in India.

## Association values live in two places

| Kind | File |
| --- | --- |
| Name, Malayalam wordmark, colours, branches, batch range, disclaimer, legal identity | `src/config/site.ts` |
| Project URLs, API keys, contact emails | `.env.local` (from `.env.example`) |

Do not hardcode “Ormakkoodu”, “GECIAN”, colours, or contact details in components. Import `siteConfig` or read settings from the database.

## File structure

```
.
├── .env.example
├── .github/workflows/          keep-alive + 90-day purge
├── scripts/
│   ├── bootstrap-admin.ts      first admin
│   └── export-data.ts          JSON + files dump
├── src/
│   ├── app/                    wall, auth, legal, admin
│   ├── config/site.ts          the one branding file
│   ├── lib/
│   │   ├── imageStore.ts       storage seam (types + keys)
│   │   ├── imageStore.server.ts
│   │   ├── imageStore.supabase.ts
│   │   └── supabase/           browser, server, service-role clients
│   └── types/database.ts
└── supabase/
    ├── config.toml
    ├── seed.sql                local fictional alumni only
    ├── functions/purge-expired
    ├── migrations/             schema, RLS, storage, auth hook
    └── tests/01_rls_phase1.test.sql
```

## Local setup

1. Clone this repository.
2. Copy environment values:

   ```bash
   copy .env.example .env.local
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start a local Supabase stack (Docker required):

   ```bash
   npx supabase start
   ```

   Copy the printed `API URL`, `anon key`, and `service_role` key into `.env.local`.

5. Migrations and seed run on start. To replay them:

   ```bash
   npx supabase db reset
   ```

6. Prove the authorisation policies:

   ```bash
   npx supabase test db
   ```

   These tests are the contract: a guest cannot read unapproved rows, and a pending member cannot upload or publish.

7. Run the Next.js app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Local magic-link emails appear in Inbucket at [http://127.0.0.1:54324](http://127.0.0.1:54324).

Seeded local users (password `ormakkoodu`, also reachable via magic link):

| Email | Role |
| --- | --- |
| admin@ormakkoodu.local | admin, verified |
| moderator@ormakkoodu.local | moderator, verified |
| member@ormakkoodu.local | member, verified |
| pending@ormakkoodu.local | member, pending |

## Create your own hosted Supabase project

1. Create a free project at [https://supabase.com/dashboard](https://supabase.com/dashboard). Choose a region close to Kerala (Mumbai / `ap-south-1` is typical).
2. Turn **off** Auth → Phone. Turn **on** Auth → Email (magic link). Optionally enable Google and paste Client ID / Secret from Google Cloud (authorized redirect `https://<project-ref>.supabase.co/auth/v1/callback`).
3. Authentication → URL configuration: set Site URL to your Vercel domain, and add `http://localhost:3000` for local testing.
4. Authentication → Hooks → **Custom Access Token**: enable `public.custom_access_token_hook`. This writes `user_role` and `user_status` into the JWT so RLS does not need a second query.
5. Link and push schema:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

6. Deploy the purge function:

   ```bash
   npx supabase functions deploy purge-expired
   npx supabase secrets set PURGE_SECRET=<a long random string>
   ```

7. Put the project URL, anon key, and service role key into Vercel environment variables (same names as `.env.example`). Never commit the service role key.

8. Set `NEXT_PUBLIC_CONTACT_EMAIL` (and the matching `settings.contact_email` row) to the mailbox volunteers will actually read. There is no grievance officer — alumni handle mail themselves.

9. Grant the first admin (the account must sign in once first):

   ```bash
   npm run admin:bootstrap -- --email you@example.com
   ```

   Then sign out and back in so the JWT picks up `user_role=admin`.

## Deploy to Vercel

1. Import the GitHub repository into Vercel.
2. Framework preset: Next.js. Root directory: repository root.
3. Environment variables (Production and Preview):

   - `NEXT_PUBLIC_SITE_URL` — `https://your-domain.vercel.app` (later a custom domain)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_CONTACT_EMAIL`

4. Deploy. Confirm `https://your-domain.vercel.app/api/health` returns `{ "ok": true }`.
5. Add that origin to Supabase Auth redirect URLs.

## Keep the project awake

Free Supabase databases pause after seven days without a query. An alumni archive will have quiet weeks.

1. In the GitHub repository: Settings → Secrets and variables → Actions.
2. Add `SITE_URL` = your Vercel URL (no trailing slash).
3. The workflow `.github/workflows/keep-alive.yml` pings `/api/health` every day at 03:00 UTC. That endpoint reads `settings`, which is enough to keep Postgres awake.
4. Add `SUPABASE_URL` and `PURGE_SECRET` for the weekly purge workflow.

You can also run the keep-alive workflow by hand from the Actions tab.

## Export everything (so you are not locked in)

```bash
npm run data:export
```

Writes `export-dump/YYYY-MM-DD/`:

- `tables/*.json` — every public table, plus Auth emails (not passwords)
- `files/photos` and `files/thumbs` — stored image bytes

Keep a copy off the laptop that runs the archive. Magic-link users can be re-invited from the email list if you move hosts.

## Storage ceiling

Supabase free tier: 500 MB database, **1 GB file storage**, 5 GB monthly egress. Photographs are compressed in the browser (WebP, longest edge 2000px, quality 80, plus a 400px thumbnail) before upload. One gigabyte is roughly four thousand compressed pictures — a twenty-five-year archive will outgrow that.

All bytes go through `src/lib/imageStore.ts`. Postgres stores only metadata and the storage key. To move to a dedicated image host later, replace `src/lib/imageStore.supabase.ts` and the re-export in `src/lib/imageStore.server.ts`. Do not talk to Storage from a component.

The admin dashboard (Phase 2) will show `admin_storage_stats()` so the ceiling is visible before it arrives.

## Authorisation model

The anon key is public. **Row Level Security is the boundary.**

| Who | Can see | Can contribute |
| --- | --- | --- |
| Guest (logged out) | Approved photos, published articles, legal pages | No |
| Pending member | Same as guest | No |
| Verified member | Plus own pending items, batch WhatsApp links | Yes, always `pending` until a moderator acts |
| Moderator | The queues | Approve / reject / hide |
| Admin | Everything above, plus verification, settings, alumni register | Yes |

Pending users browse; they do not publish. Guests never see unapproved rows. Phone numbers are not on `public_profiles`. WhatsApp invite URLs are not on `batch_groups_public`. The audit log has no update or delete policy.

Uploads cannot be inserted as `approved`. That is both an RLS `WITH CHECK` and a trigger. There is no flag that turns moderation off.

## Legal

Legal pages are markdown rows in `legal_documents` (privacy, terms, content policy, takedown, contact). Admins can edit them. They are not a substitute for a lawyer. There is no grievance officer; removal requests and complaints go to the alumni contact email. Confirm that mailbox and the consent version before inviting the wider alumni body.

Consent is stored on the profile (`consent_accepted_at`, `consent_version`). If `settings.consent_version` changes, contributors must accept again. Account deletion anonymises contributions (“Former member”) rather than orphaning them. Removed items stay hidden for 90 days, then `purge_expired_content()` deletes them.

## Handover for the next volunteer

You are taking over a community archive, not a college system.

1. Get the GitHub repo, Vercel project, and Supabase project (or create new ones and run `db push` plus a data export restore).
2. Rotate the service role key if the previous operator is leaving. Update Vercel env and any GitHub secrets.
3. Confirm you are an admin (`npm run admin:bootstrap -- --email your@email`).
4. Update `src/config/site.ts` only if branding changed. Update the alumni contact email in **settings** and in env.
5. Run `npm run data:export` and store the dump with two people, not one.
6. Check that keep-alive ran in the last week (Actions tab) and that `/api/health` is green.
7. Read `supabase/migrations/20260919100005_rls.sql`. That file is the access-control source of truth.

If you are stuck, the previous volunteer’s batch year is recorded in `siteConfig.association.foundingMaintainerBatch` (2007–2011) as provenance, not as a gate. GECIAN maintains this together.

## What is not in this codebase (and will not be)

- Face recognition or automatic people tagging
- Public listing of phone numbers or emails
- Any upload path that skips moderation
- Payment collection
- Phone OTP
- Infinite scroll (pagination, when the wall ships)
