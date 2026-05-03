> ⚠️ This document is AI-generated orientation material.
> It explains how this project uses the technology, not the technology itself.
> Follow the external links for authoritative, verified documentation.

# Contributing to Scrolls

## Local Setup

1. **Check requirements**: `make check`
2. **Install dependencies**: `make setup` (runs `npm install` and copies `.env.example` to `.env.local`)
3. **Fill in env vars**: Edit `.env.local` — you need at minimum `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Create a Supabase project**: https://app.supabase.com — free tier is fine for local dev
5. **Apply migrations**: `supabase db push`
6. **Start the app**: `make dev` → http://localhost:3000

## Branch Conventions

- `main` is always deployable — no direct commits
- Feature work: `feature/description`
- Bug fixes: `fix/description`
- Chores: `chore/description`

## Pull Requests

- PRs require CI checks to pass before merge
- Commit messages are imperative: "Add scroll versioning" not "added versioning"
- Keep PRs focused — one concern per PR

## Adding API Routes

Follow the pattern in `app/api/health/route.ts` and the conventions in `CLAUDE.md`:
1. Import `createServerClient` from `@/lib/supabase/server`
2. Validate session first — return 401 if no session
3. Validate request body
4. Check ownership before DB writes
5. Log with `logger.info()` from `@/lib/logger`

## Adding shadcn Components

```bash
npx shadcn@latest add [component-name]
```

Components are copied into `components/ui/` and owned by the project — you can modify them freely.

## Adding Database Migrations

Create a new file in `supabase/migrations/` with format `YYYYMMDDHHmmss_description.sql`.
Always include RLS policies in the same file as the table creation.

Apply locally: `supabase db push`

## Running Tests

```bash
make test
```

## Linting and Type Checking

```bash
make lint
```
