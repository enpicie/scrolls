> ⚠️ This document is AI-generated orientation material.
> It explains how this project uses the technology, not the technology itself.
> Follow the external links for authoritative, verified documentation.

# Architecture

## How the Pieces Connect

Scrolls is a Next.js 16 App Router application. All pages are server-rendered by default. The browser
receives HTML; JavaScript hydrates interactive components client-side.

```
Browser
  │
  ├─ GET  /               → app/page.tsx (landing, public)
  ├─ GET  /browse         → app/(public)/browse/page.tsx (marketplace)
  ├─ GET  /[slug]/[slug]  → app/(public)/[owner]/[scroll]/page.tsx (detail)
  ├─ GET  /dashboard      → app/(app)/dashboard/page.tsx (auth-protected)
  │
  ├─ POST /api/*          → app/api/**  (all writes, session-validated)
  │
  └─ Auth flow:
       OAuth redirect → Supabase → /api/auth/callback → /dashboard

Middleware (middleware.ts)
  └─ Runs on every request
  └─ Refreshes Supabase session cookies
  └─ Redirects unauthenticated users away from protected routes

Database (Supabase Postgres)
  └─ RLS policies enforce access at the data layer
  └─ Anon key used everywhere — RLS is the security boundary
  └─ Service role key never leaves server-side code
```

## Request Lifecycle

1. Request hits Next.js middleware — session cookies refreshed
2. Server component renders — can call Supabase directly (server client)
3. Any write triggered by user action → POST to `/api/*` route
4. API route: validate session → validate body → DB operation → log → respond
5. Client receives response, updates UI

## Key Architectural Decisions

**No direct browser writes to Supabase.** All mutations go through API routes that validate the
session server-side. The browser client is read-only.

**Two Supabase clients, never crossed.** `lib/supabase/client.ts` (browser, anon key) for client
components; `lib/supabase/server.ts` (server, async cookies) for API routes and server components.

**Soft deletes for user content.** `deleted_at` timestamp instead of `DELETE` — authored content
is never hard-deleted. A 30-day grace period applies after soft delete.

**Denormalized counters.** `scrolls.favorite_count` and `scrolls.pull_count` are maintained by
Postgres triggers on `user_favorites` and `scroll_pulls`. This keeps the marketplace browse query
fast without per-request aggregation joins.

**Circular FK resolved via ALTER TABLE.** `scrolls.active_version_id` → `scroll_versions` creates
a circular dependency with `scroll_versions.scroll_id` → `scrolls`. Resolved by creating both
tables first, then adding the FK via `ALTER TABLE`.

## Component Organization

```
components/
  ui/           shadcn/ui components (copied into repo, owned)
  scroll/       Scroll-specific UI (ScrollCard, ScrollRow, TypeBadge, etc.)
  layout/       Nav, sidebar, shell components
  editor/       Scroll editor (guided + raw modes)
  team/         Team settings and member management
```

## Related Docs

- [Next.js App Router](docs/nextjs.md)
- [Supabase + RLS](docs/supabase.md)
- [Auth flow](docs/auth.md)
- [Contributing guide](docs/contributing.md)
- [Data model](.platform/data-model.md) (gitignored)
- [Scaling plan](.platform/scaling-plan.md) (gitignored)
