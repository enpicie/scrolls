> ⚠️ This document is AI-generated orientation material.
> It explains how this project uses the technology, not the technology itself.
> Follow the external links for authoritative, verified documentation.

# Next.js in Scrolls

## Version
Next.js 16, App Router. No Pages Router. No `src/` directory.

## Routing
App Router: file-based routing under `app/`. Route groups `(auth)` and `(app)` are used
for layout scoping — `(app)` contains auth-protected pages, `(auth)` contains the OAuth callback.

- `app/page.tsx` → `/` (landing)
- `app/(app)/dashboard/page.tsx` → `/dashboard`
- `app/(auth)/callback/route.ts` → `/callback` (OAuth handler)
- `app/api/**/route.ts` → API endpoints

Reference: https://nextjs.org/docs/app/building-your-application/routing

## Server vs Client Components
Components are server components by default. Add `'use client'` only when:
- You need `useState`, `useEffect`, or other React hooks
- You need browser APIs
- You need event handlers (onClick, onChange, etc.)

Reference: https://nextjs.org/docs/app/building-your-application/rendering/server-components

## API Routes (Route Handlers)
All API endpoints live under `app/api/`. Export named functions for HTTP methods:

```typescript
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }
```

Reference: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

## Async APIs (Next.js 15+)
In Next.js 15+, these APIs are async — always `await` them:
- `cookies()` from `next/headers`
- `headers()` from `next/headers`
- `params` and `searchParams` in page/layout components

Reference: https://nextjs.org/docs/app/building-your-application/upgrading/version-15

## Middleware
`middleware.ts` at the project root runs on every request. Used to refresh Supabase session
cookies and redirect unauthenticated users away from protected routes.

Reference: https://nextjs.org/docs/app/building-your-application/routing/middleware

## Environment Variables
`NEXT_PUBLIC_` prefix exposes variables to the browser bundle. Never use this prefix for secrets.
`SUPABASE_SECRET_KEY` must never have the `NEXT_PUBLIC_` prefix.

Reference: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
