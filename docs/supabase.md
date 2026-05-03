> ⚠️ This document is AI-generated orientation material.
> It explains how this project uses the technology, not the technology itself.
> Follow the external links for authoritative, verified documentation.

# Supabase in Scrolls

## Two Clients — Never Crossed

**Browser client** (`lib/supabase/client.ts`) — uses the anon key. Used in client components
and hooks. Read-only by convention; RLS enforces what the anon key can actually do.

**Server client** (`lib/supabase/server.ts`) — also uses the anon key but reads cookies from the
request, so it has access to the authenticated user's session. Used in API routes and server
components. Must be awaited: `const supabase = await createServerClient()`.

Never import the server client in a client component (`'use client'`).

Reference: https://supabase.com/docs/guides/auth/server-side/nextjs

## Row Level Security (RLS)

Every table has RLS enabled. The anon key cannot bypass RLS — it is the security boundary.

Policies are defined in the same migration file as the table. Never create a table without
adding policies in the same file.

Common patterns used in this project:
- `auth.uid() = user_id` — owner can read/write their own rows
- `is_published = true AND is_public = true` — public can read published content
- Team membership checked via join to `team_members`

Reference: https://supabase.com/docs/guides/database/postgres/row-level-security

## Auth
OAuth only (GitHub and Google). No email/password. Supabase Auth handles the full OAuth flow.
After OAuth, a row is created in the public `users` table via a trigger on `auth.users`.

Reference: https://supabase.com/docs/guides/auth

## Migrations
SQL migrations live in `supabase/migrations/`, timestamp-prefixed: `YYYYMMDDHHmmss_description.sql`.

Apply locally:
```bash
supabase db push
```

Apply to production:
```bash
supabase db push --linked
```

Reference: https://supabase.com/docs/guides/deployment/database-migrations

## Circular FK Pattern
`scrolls.active_version_id` references `scroll_versions`, and `scroll_versions.scroll_id`
references `scrolls`. This circular dependency is resolved in migrations by:
1. Creating both tables without the circular FK
2. Using `ALTER TABLE scrolls ADD COLUMN active_version_id ...` in a subsequent migration

See `supabase/migrations/20260502000008_scrolls_active_version_fk.sql`.
