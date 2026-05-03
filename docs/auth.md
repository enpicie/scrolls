> ⚠️ This document is AI-generated orientation material.
> It explains how this project uses the technology, not the technology itself.
> Follow the external links for authoritative, verified documentation.

# Authentication in Scrolls

## Flow

1. User clicks "Sign in with GitHub" or "Sign in with Google"
2. Browser redirects to Supabase OAuth endpoint
3. Supabase redirects to provider (GitHub / Google)
4. Provider redirects back to `/callback?code=...`
5. `app/(auth)/callback/route.ts` exchanges the code for a session
6. Session cookies set; user redirected to `/dashboard`

## OAuth Providers

Both GitHub and Google OAuth are required. Configure both in your Supabase project:
- **GitHub OAuth**: https://supabase.com/docs/guides/auth/social-login/auth-github
  - Required scope: `read:user`, `user:email`, and `repo` (for repo-managed scroll syncing)
- **Google OAuth**: https://supabase.com/docs/guides/auth/social-login/auth-google

Set your OAuth callback URL in both providers to:
```
https://<your-supabase-project>.supabase.co/auth/v1/callback
```

## Session Management

Sessions are stored in cookies managed by `@supabase/ssr`. Middleware refreshes the session
on every request. The server client reads the session from cookies.

Always use `supabase.auth.getUser()` (not `getSession()`) in middleware — `getUser()` validates
the JWT server-side; `getSession()` reads from cookies without validation.

## User Record

On first sign-in, Supabase creates a row in `auth.users`. A Postgres trigger creates a
corresponding row in the public `users` table with `display_name` and `avatar_url` sourced
from the OAuth provider profile.

## Protected Routes

`proxy.ts` (Next.js 16's replacement for `middleware.ts`) protects `/dashboard`, `/scrolls/new`,
and `/scrolls/*/edit`. Unauthenticated requests to these routes are redirected to `/`.
