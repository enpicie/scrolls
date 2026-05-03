# Scrolls

**The marketplace for platform specs.**

License: BUSL 1.1 | Status: Alpha

Scrolls is a marketplace where experienced engineers publish platform specs — encoded standards for how projects should be built — and developers at any level can discover, compose, and use them to start or audit projects with professional-grade foundations.

---

## Local Setup

### Requirements

Run `make check` to verify all tools are installed.

- Node.js 24 LTS — [nvm](https://github.com/nvm-sh/nvm): `nvm install 24 && nvm use 24`
- npm — ships with Node
- git — https://git-scm.com/downloads
- make — `brew install make` (macOS) / `sudo apt install make` (Linux)
- supabase CLI — https://supabase.com/docs/guides/cli/getting-started

### Steps

```bash
make setup          # install deps, copy .env.example → .env.local
```

Edit `.env.local` — fill in your Supabase URL and anon key at minimum.

```bash
supabase db push    # apply all migrations to your local/linked Supabase project
make dev            # start the app at http://localhost:3000
```

---

## Environment Variables

See [.env.example](.env.example) for all variables with inline documentation.

Required to run locally:
- `NEXT_PUBLIC_SUPABASE_URL` — from your Supabase project dashboard
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — from your Supabase project dashboard
- `SUPABASE_SECRET_KEY` — keep secret, never expose to browser

---

## Running the App

```bash
make dev
```

Opens at http://localhost:3000. Requires `.env.local` with Supabase credentials.

---

## Running Tests

```bash
make test
```

---

## Linting and Type Checking

```bash
make lint
```

---

## Deployment

Vercel auto-deploys on push to `main` via GitHub integration. Pre-deploy checks run
in `.github/workflows/deploy.yml`. Add all environment variables to Vercel project settings.

Database migrations are applied manually via `supabase db push --linked` until automated
migration steps are added to the deploy workflow.

---

## Initial Setup TODOs

- [x] Copy `.env.example` to `.env.local` and fill in real Supabase values
- [x] Create Supabase project, copy URL and keys to `.env.local`
- [x] Enable GitHub OAuth provider in Supabase Auth dashboard (add `repo` read scope)
- [x] Enable Google OAuth provider in Supabase Auth dashboard
- [x] Run `supabase db push` to apply all migrations
- [x] Connect repo to Vercel, enable auto-deploy on push to `main`
- [x] Add all env vars to Vercel project settings (Settings → Environment Variables)
- [x] Create Sentry project, add `SENTRY_DSN` to `.env.local` and Vercel env vars
- [x] Create Anthropic API key, add `ANTHROPIC_API_KEY` to `.env.local` and Vercel env vars
- [x] Verify `make dev` starts the full local stack cleanly
- [ ] Complete `.platform/data-model.md` with diagram
- [ ] Complete `.platform/scaling-plan.md` with current thresholds
- [ ] Update README status badge to correct value
- [ ] Review `CLAUDE.md` and confirm conventions are accurate

---

## Architecture Notes

Next.js 16 App Router + Supabase Postgres + Vercel. All writes go through API routes with
server-side session validation. RLS enforced on every table. Two Supabase clients — never crossed.

See [docs/architecture.md](docs/architecture.md) for the full architecture walkthrough.
Additional detail in `.platform/` (gitignored).
