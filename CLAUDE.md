## Stack
Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui, Supabase (Auth + Postgres), Vercel

## Security Rules — Non-Negotiable
- Never create a table without RLS policies in the same migration file
- Never use the server Supabase client (`lib/supabase/server.ts`) in a client component
- Never prefix `SUPABASE_SECRET_KEY` with `NEXT_PUBLIC_` — never reference it in any client-side file
- All writes go through API routes — the browser never writes to Supabase directly
- Validate session at the top of every API route before any other operation

## API Route Pattern
Every API route follows this exact sequence:
1. Create server client: `const supabase = await createServerClient()`
2. Validate session: `const { data: { session } } = await supabase.auth.getSession()` — return 401 if null
3. Parse and validate request body
4. Confirm ownership before any DB operation
5. Execute DB operation
6. Log the event via `logger.info()`
7. Return result

## Conventions
- Components are grouped by feature in `components/[feature]/`, not by type
- `components/ui/` is for shadcn components only — do not add app logic there
- Hooks live in `hooks/`, shared TypeScript types in `types/`
- Logger is imported from `@/lib/logger` — never use `console.log` directly in application code
- `cn()` utility is in `@/lib/utils` — use it for all conditional class merging
- Column names and API field names use `snake_case` to match the database schema
- Scroll type color classes: `bg-scroll-general`, `bg-scroll-stack`, `bg-scroll-app`

## Next.js 16 / React 19 Notes
- `cookies()` and `headers()` from `next/headers` are async — always `await` them
- Route params (`params`, `searchParams`) in layouts and pages are async — always `await` them
- Server Actions use `'use server'` directive
- `createServerClient()` in `lib/supabase/server.ts` is async — always `await` it

## Do Not Modify Without Explicit Instruction
- `lib/supabase/client.ts` and `lib/supabase/server.ts`
- `proxy.ts` — auth proxy (Next.js 16 replacement for middleware.ts; session refresh + route protection)
- Any RLS policies in `supabase/migrations/`
- `.env.example` — add new keys, never remove existing ones

## Data Model Summary
Core entities: `users`, `teams`, `team_members`, `team_invitations`, `scrolls`, `scroll_versions`,
`scroll_version_events`, `tags`, `scroll_tags`, `user_favorites`, `scroll_pulls`

Scroll ownership: exactly one of `user_id` or `team_id` is set — enforced by DB constraint.
Active version: `scrolls.active_version_id` — nullable until first publish.
Counters: `favorite_count` and `pull_count` on `scrolls` are denormalized, updated via DB triggers.

## Scroll Type Color System
Applied everywhere a scroll type appears (cards, list rows, detail page header, editor):
- `general` → `scroll-general` (indigo)
- `stack`   → `scroll-stack` (violet)
- `app`     → `scroll-app` (emerald)
