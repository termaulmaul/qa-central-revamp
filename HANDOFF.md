Status: READY — module port from qa-central-dashboard is complete and verified.
Canonical handoff: `.brain/runtime/session-handoff.md` (full detail: what was built, what's
intentionally stubbed and why, validation evidence, next actions). Read that first for this
work; the auth documentation below is separate, older reference material and still accurate.

---

# QA Central Revamp — Authentication Handoff

This document describes the authentication system that was wired up for QA Central
Revamp: the Supabase backend, the database schema, the login flow, and how to
operate/extend it.

---

## 1. Overview

Auth is built on **Supabase Auth (email + password)** with a username-based login
UX. Users log in with a **username** (not an email); the server resolves the
username to the underlying auth email and then signs in with password.

- Framework: **Next.js (App Router) + `@supabase/ssr`**
- Session handling: cookie-based, refreshed in `src/middleware.ts`
- Roles: `god`, `admin`, `qa`, `developer`, `viewer` (Postgres enum `user_role`)

---

## 2. Supabase project

| Item | Value |
| --- | --- |
| Project name | `qa-central-revamp` |
| Project ref | `glqvzhaccgysmilvjndf` |
| Region | `ap-southeast-1` (Singapore) |
| API URL | `https://glqvzhaccgysmilvjndf.supabase.co` |

### Environment variables

Set in `.env.development.local` (and mirrored to the canonical project env):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key used by browser + server client |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | Dev redirect URL (already provisioned) |

> The `service_role` key is **not** stored in the app. It was used only from
> one-off admin scripts (user provisioning). Never ship it to the client.

---

## 3. Database schema

Source of truth: **`supabase/migrations/0001_auth_profiles.sql`** (idempotent —
safe to re-run on a fresh or existing database).

### `user_role` enum
`god | admin | qa | developer | viewer`

### `public.profiles`
1:1 with `auth.users`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | FK → `auth.users(id)` on delete cascade |
| `username` | `text` | unique, case-insensitive unique index |
| `display_name` | `text` | shown in UI |
| `role` | `user_role` | default `viewer` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | auto-updated via trigger |

### Row Level Security
RLS is **enabled**. Policies:
- `profiles_select_authenticated` — any authenticated user can read profiles.
- `profiles_update_own` — a user can update only their own row (`auth.uid() = id`).
- No end-user INSERT policy — rows are created by the trigger below.

### Triggers & functions
- **`handle_new_user()`** + trigger `on_auth_user_created` (AFTER INSERT on
  `auth.users`): auto-provisions a `profiles` row from `raw_user_meta_data`
  (`username`, `display_name`, `role`). It is **exception-safe** — a failure here
  logs a warning and never blocks signup.
- **`set_updated_at()`** + trigger `profiles_set_updated_at`: keeps `updated_at`
  current on every update.
- **`email_for_username(uname text)`** — `SECURITY DEFINER` resolver that returns
  the auth email for a given username (case-insensitive). Granted to `anon` and
  `authenticated`. This powers username-based login.

---

## 4. Login flow

1. User submits **username + password** to the `signIn` server action
   (`src/app/auth/actions.ts`).
2. `resolveEmail()` — if the identifier contains `@` it is treated as an email;
   otherwise it calls the `email_for_username` RPC to resolve the auth email.
3. `supabase.auth.signInWithPassword({ email, password })` establishes the
   session (cookies).
4. On success, redirect to `redirectTo` (defaults to `/`).
5. Errors are collapsed into a generic **"Invalid username or password."** to
   avoid leaking which usernames exist.

`signOut` clears the session and redirects to `/login`.

---

## 5. Key files

| File | Responsibility |
| --- | --- |
| `supabase/migrations/0001_auth_profiles.sql` | Schema, RLS, triggers, resolver |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Supabase client (cookies) |
| `src/lib/supabase/middleware.ts` | Session refresh helper |
| `src/middleware.ts` | Runs session refresh / route protection |
| `src/app/auth/actions.ts` | `signIn` / `signOut` server actions |
| `src/app/login/page.tsx` + `login-form.tsx` | Login UI |
| `src/lib/auth.ts` | `getSessionProfile()` for RSC (server) |
| `src/lib/use-current-user.ts` | `useCurrentUser()` hook (client) |

Both `getSessionProfile()` (server) and `useCurrentUser()` (client) return
`{ id, email, username, displayName, role }`.

---

## 6. Seeded account (god)

A bootstrap super-user was created:

| Field | Value |
| --- | --- |
| Username | `MNURDIANSYAH270` |
| Password | `MNURDIANSYAH270` |
| Email (internal) | `mnurdiansyah270@qa-central.local` |
| Role | `god` |

> **Change this password before going to production.** The username-based email
> scheme (`<username>@qa-central.local`) is an internal placeholder for
> password auth; end users never see or type the email.

---

## 7. Creating additional users

Users are provisioned through the Supabase Admin API (service_role) with the
username/display_name/role passed in `user_metadata`; the `on_auth_user_created`
trigger then creates the matching `profiles` row. Example shape:

```jsonc
// POST {SUPABASE_URL}/auth/v1/admin/users   (Authorization: Bearer <service_role>)
{
  "email": "<username>@qa-central.local",
  "password": "<password>",
  "email_confirm": true,
  "user_metadata": {
    "username": "<username>",
    "display_name": "<display name>",
    "role": "qa"            // god | admin | qa | developer | viewer
  }
}
```

To change a role later, update `public.profiles.role` for that user id.

---

## 8. Applying the migration elsewhere

Run the SQL in `supabase/migrations/0001_auth_profiles.sql` against the target
database (via the Supabase SQL editor, the Management API `database/query`
endpoint, or `psql`). It is idempotent and also reconciles a legacy `full_name`
column to `display_name` if present.

---

## 9. Known notes / follow-ups

- **PostgREST schema cache**: after DDL changes, run
  `notify pgrst, 'reload schema';` (or wait) so the REST layer picks up new
  columns.
- **Password reset / email flows** are not configured — accounts are
  admin-provisioned. Add SMTP + reset flows if self-service is needed later.
- **No self-service signup** — there is no public registration UI by design.
