'use client'

import { useState, useCallback, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react'
import { GuidedSection, type NudgeState } from '@/components/editor/guided-section'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { AlertCircle, CheckCircle2, Info, Plus, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ScrollType } from '@/types'

// ─── Section type definitions ──────────────────────────────────────────────────

interface StandardSection {
  id: string
  title: string
  description: string
  stem: string
}

interface CustomSectionMeta {
  title: string
  description: string
}

type SectionRef =
  | { kind: 'standard'; id: string }
  | { kind: 'custom'; id: string }

// Used by ReviewDialog — minimal shape needed for display
interface ReviewableSection {
  id: string
  title: string
}

// ─── Standard section data ─────────────────────────────────────────────────────

const GENERAL_SECTIONS: StandardSection[] = [
  {
    id: 'philosophy',
    title: 'Engineering Philosophy',
    description: 'Principles that govern tradeoff decisions and define done',
    stem: 'We prefer pragmatism over purity, but never at the cost of correctness or security.\n\n- "Done" means: tested locally, CI passes, no regressions observed\n- Over-engineering: no abstractions until the third time the pattern appears\n- Technical debt: tracked in TODO.md with a rationale note; addressed each sprint, not deferred indefinitely',
  },
  {
    id: 'code_style',
    title: 'Code Style and Consistency',
    description: 'Naming conventions, comment philosophy, and anti-patterns',
    stem: '- We do not use abbreviations in variable names except universally understood ones (`i`, `id`, `err`, `ctx`, `req`, `res`)\n- Comment philosophy: comment the why, not the what — no comments on self-explanatory code\n- A function is too large when it has more than one reason to change or exceeds ~50 lines of non-boilerplate',
  },
  {
    id: 'git',
    title: 'Git Standards',
    description: 'Commit format, branch naming, and merge invariants',
    stem: '- Commit format: imperative present tense — "Add usage events table", not "Added" or "Adding table"\n- Main invariant: main is always deployable — broken code is reverted to a branch, never fixed directly on main\n- Branch naming: `feature/`, `fix/`, `chore/` prefix — e.g. `feature/scroll-versioning`, `fix/auth-redirect-loop`\n- Tagging: semver tags on releases — `v1.0.0`, `v1.1.0`, `v2.0.0`\n- A commit represents one logical change — do not bundle unrelated fixes or refactors',
  },
  {
    id: 'documentation',
    title: 'Documentation Standards',
    description: 'What gets documented, in what form, and when',
    stem: '- A README is required on every project — sections: name + description, status, local setup, env vars, run, test, deploy, TODOs, architecture notes\n- Inline docs: comment the why behind non-obvious decisions — never describe what the code does\n- Decision record vs. inline comment: architectural decisions go in `docs/architecture.md`; tactical choices get a one-line inline comment\n- Changelog: not maintained at MVP — version changelogs captured at publish time per version',
  },
  {
    id: 'testing',
    title: 'Testing Philosophy',
    description: 'What must be tested, what must not, and what a good test looks like',
    stem: '- Always tested: auth flows, data mutation API routes, RLS policy enforcement, any function with a destructive or financial outcome\n- Never tested: UI snapshots, trivial getters, anything that only tests the framework\'s own behavior\n- Test naming: describe the behavior verified — "returns 401 when session is missing", not "test auth middleware"\n- Coverage metrics: a byproduct, not a goal — 80% meaningful coverage beats 100% padding',
  },
  {
    id: 'security',
    title: 'Security Baseline',
    description: 'Non-negotiables for secrets, validation, and auth at the org level',
    stem: '- Non-negotiables: no secrets committed ever, session validated server-side before every write, access control enforced at the database level\n- Secrets live in `.env.local` (gitignored). Never committed: `.env*`, API keys, service role keys, OAuth client secrets\n- Input validation: at the API route boundary — never trust client-supplied IDs, roles, or ownership claims\n- New dependency must: be actively maintained (commit in last 6 months), have a permissive license (MIT/Apache/ISC), and solve something not achievable in <50 lines',
  },
  {
    id: 'error_handling',
    title: 'Error Handling Standards',
    description: 'How errors are caught, logged, and surfaced',
    stem: '- Errors are caught at: API route handlers and top-level async server components — never silently in nested utilities\n- User sees: a human-readable message with no stack trace, no internal field names, no raw DB errors\n- Logs contain: event name, user ID (if authenticated), error object, timestamp — via `logger.error()`, never `console.error()` directly\n- Never swallow errors except: expected 404s on optional resource fetches where absence is a valid state\n- Logging verbosity: readable in development; structured JSON in production (parseable by log drain)',
  },
  {
    id: 'performance',
    title: 'Performance Baseline',
    description: 'What is always in scope and when optimization is premature',
    stem: '- Always in scope from day one: no N+1 queries, index every foreign key and high-cardinality WHERE column, no synchronous blocking on the main thread\n- Optimization is premature until: a real user or a profiler identifies a specific, measured bottleneck\n- Caching / memoization: opt-in only — never applied speculatively; cache only when a measured problem exists\n- Thresholds that must not be violated: API routes respond in <500ms at P95; DB queries stay under 100ms on indexed paths',
  },
  {
    id: 'local_dev',
    title: 'Local Development Environment',
    description: 'Tooling, environment setup, and clone-to-running steps',
    stem: '- Required tooling: Node.js (version pinned in `.nvmrc`), git, make, and any stack-specific CLIs defined in the stack scroll\n- Runtime: LTS Node pinned in `.nvmrc`. Package manager: npm — do not introduce yarn or pnpm; pick one and stay consistent\n- From clone to running: `git clone` → `cp .env.example .env.local` → fill in values → `make setup` → `make dev` — under 5 minutes on a clean machine\n- Never committed: `.env*`, `.claude/`, `.platform/`, `node_modules/`, build artifacts, OS files (`.DS_Store`, `Thumbs.db`)',
  },
  {
    id: 'ci_cd',
    title: 'CI/CD Philosophy',
    description: 'What gates a merge or deploy and how failures are handled',
    stem: '- A merge requires: lint, type check (`tsc --noEmit`), tests, and build all passing in CI — no exceptions, no bypasses\n- A deployment requires: the same checks as merge; production deploys happen only through CI, never manually\n- Failed pipeline: fix forward if the fix is immediate and small; revert the offending commit if not\n- Environment path: local → production (no staging until Tier 2 — see `.platform/scaling-plan.md` for when to add it and why)',
  },
  {
    id: 'dependencies',
    title: 'Dependency Management',
    description: 'How new dependencies are evaluated and maintained',
    stem: '- A new dependency must: be actively maintained (commit in last 6 months), have a permissive license (MIT/Apache/ISC), and solve something not achievable in <50 lines of our own code\n- Lockfile: always committed; never manually edited; updated only via the package manager CLI (`npm install`, `npm update`)\n- Keeping dependencies current: update when a security advisory is published — not proactively every sprint\n- Criteria to remove: unused for 30+ days, superseded by a native API, or maintenance burden exceeds value',
  },
  {
    id: 'scaling',
    title: 'Scaling Philosophy',
    description: 'When optimization is required and what gets instrumented by default',
    stem: '- Current stage: pre-launch (0–1k MAU) — free tier infrastructure is sufficient\n- Instrumented from day one: request rate, error rate, latency (infrastructure-level tool), plus structured application event logs\n- Optimization is premature when predicted or theoretical; required when a measured bottleneck affects real users\n- "Good enough for now" means: current infrastructure handles load with <200ms median API response\n- Revisit when: sustained >1k MAU or P95 API response exceeds 500ms',
  },
]

const STACK_SECTIONS: StandardSection[] = [
  {
    id: 'identity',
    title: 'Stack Identity',
    description: 'Full stack declaration with version pins and rationale',
    stem: '- Language: TypeScript — strict mode, no `any`, `"strict": true` in `tsconfig.json`\n- Runtime: Node.js LTS (pinned in `.nvmrc`). Framework: Next.js 16 with App Router\n- Database: Supabase Postgres with RLS enforced on every table. Hosting: Vercel — auto-deploys on push to `main`\n- Optimized for: desktop-primary web apps with server-rendered pages and a REST-style API\n- Not suited for: real-time collaborative editing, mobile-native experiences, or high-frequency write workloads\n- Chose Supabase over self-managed Postgres because managed auth + RLS + migrations in one service eliminates three separate integration surfaces at MVP',
  },
  {
    id: 'structure',
    title: 'Project Structure',
    description: 'Directory layout and rules for where specific code lives',
    stem: '- `/app` — Next.js App Router root. `/app/api/` for all API routes (server-side only). `/app/(app)/` for protected routes. `/app/(auth)/` for OAuth handlers\n- `/components/ui/` — shadcn/ui primitives only, no app logic. `/components/[feature]/` — feature-grouped (e.g. `/components/scroll/`, `/components/editor/`)\n- `/lib/supabase/client.ts` — browser Supabase client (anon key only). `/lib/supabase/server.ts` — server client (API routes only, never in client components)\n- Business logic never in: route handlers (orchestration only), React components (rendering only)\n- File naming: kebab-case for files, PascalCase for exported components. Shared types in `/types/`. Client-side hooks in `/hooks/`',
  },
  {
    id: 'language',
    title: 'Language and Runtime Specifics',
    description: 'TypeScript settings, preferred features, and explicit exclusions',
    stem: '- Strict settings: `"strict": true` — enables `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`. No exceptions, no `@ts-ignore` comments\n- Preferred features: optional chaining (`?.`), nullish coalescing (`??`), destructuring, const assertions (`as const` for literal types)\n- Explicitly avoided: `any` (use `unknown` and narrow with type guards); TypeScript enums (use const objects or string union types); `namespace`\n- Compiler config: paths alias `@/*` → repo root; `moduleResolution: bundler`; `jsx: preserve` for Next.js. Target: ES2022',
  },
  {
    id: 'framework',
    title: 'Framework Conventions',
    description: 'How core primitives are used and what is explicitly avoided',
    stem: '- Routing: App Router only — layouts in `layout.tsx`, pages in `page.tsx`, route handlers in `route.ts`. No Pages Router files anywhere\n- Data fetching: server components fetch directly via the server Supabase client. Client components call API routes for writes and reads requiring fresh data\n- We do not use: React class components, `useEffect` for data fetching, `getServerSideProps` / `getStaticProps`, or `<script>` tags for FOUC prevention\n- Anti-patterns to avoid: importing server-only modules (`cookies`, `headers`) in client components; putting business logic in `layout.tsx`; using `params` without awaiting in Next.js 16',
  },
  {
    id: 'state',
    title: 'State Management',
    description: 'Where state lives at each level and mutation patterns',
    stem: '- Chosen solution: React built-ins (`useState`, `useContext`) for UI state; server components + props for server data. No global state library at MVP\n- Rejected: Redux (too heavy for MVP scope); Zustand (introduce only when prop drilling exceeds 3 levels across unrelated subtrees)\n- Server data: fetched in server components, passed as props to client components\n- UI state: `useState` in client components\n- Shared client state: `useContext` scoped to the feature — not a global store\n- Nothing in global state except: user session (managed by Supabase Auth SSR, read server-side from cookies)',
  },
  {
    id: 'data_fetching',
    title: 'Data Fetching and API Layer',
    description: 'Chosen approach, caching strategy, and API client structure',
    stem: '- Chosen approach: Next.js route handlers (`/app/api/*`) for all writes and authenticated reads; server components fetch via the server Supabase client for public or SSR reads\n- Rejected: tRPC (adds complexity not justified at MVP scale); React Query (introduce only when client-side caching complexity requires it)\n- Loading / error / empty states: every async UI must show a skeleton while loading, an error message with retry on failure, and a designed empty state — never a blank container\n- Caching: Next.js fetch cache for public read routes only. No caching on authenticated or write routes\n- Auth attached via: server Supabase client reads session from request cookies on every API call — no manual token handling in the client',
  },
  {
    id: 'database',
    title: 'Database and ORM',
    description: 'Database choice, migration discipline, and N+1 prevention',
    stem: '- Database: Supabase Postgres. Query interface: Supabase JS client (`@supabase/supabase-js`) — no separate ORM layer\n- Migrations: SQL files in `supabase/migrations/`, named `YYYYMMDDHHmmss_description.sql`, applied via `supabase db push`. Every migration that creates a table must include RLS policies in the same file — never added separately\n- N+1 prevention: use `.select(\'*, relation(field1, field2)\')` to fetch related data in one query — never fetch a list then loop to fetch each item\'s relations\n- Raw SQL acceptable for: complex aggregations not expressible via the JS client\n- Always use the JS client for: standard CRUD and any query touching `auth.users`',
  },
  {
    id: 'auth',
    title: 'Authentication and Authorization',
    description: 'Auth approach, where auth logic lives, and access boundaries',
    stem: '- Auth approach: Supabase Auth with GitHub and Google OAuth — no custom auth logic, no JWTs managed manually by the app\n- Auth logic lives in: `/lib/supabase/server.ts` (session validation), `proxy.ts` (session refresh + route protection). Never in: components, client-side utilities, or any code running in the browser\n- Authorization model: RLS policies enforce row-level access at the database level. API routes additionally confirm `user_id` or team membership before any write\n- Token storage: Supabase `@supabase/ssr` manages session cookies automatically — never store tokens in `localStorage` or client-side state\n- Refresh: handled by `proxy.ts` on every request — no manual refresh calls\n- Unauthenticated cannot access: any route under `/app/(app)/`, any write endpoint, any private or unpublished resource',
  },
  {
    id: 'styling',
    title: 'Styling and UI',
    description: 'CSS approach, design tokens, responsive conventions, and component library',
    stem: '- Approach: Tailwind CSS v4 utility classes + shadcn/ui component library. No CSS modules, no styled-components, no CSS-in-JS\n- Design tokens in: `app/globals.css` (`@theme inline` block). Referenced via Tailwind semantic utility classes (`bg-background`, `text-foreground`, `border-border`) — never hardcode hex, oklch, or rgb values in component files\n- Responsive: mobile-first base styles; `lg:` breakpoint handles desktop-primary layouts. No horizontal scroll at standard viewport widths\n- Never inline styles except: truly dynamic values that cannot be expressed as Tailwind utilities (e.g. runtime-computed chart widths)\n- Component library: shadcn/ui for base UI primitives. Feature-specific components in `/components/[feature]/` — never placed in `/components/ui/`',
  },
  {
    id: 'components',
    title: 'Component Architecture',
    description: 'Size guidelines, prop patterns, and where business logic lives',
    stem: '- A component splits when: it exceeds ~150 lines, has more than one reason to change, or its props interface exceeds 8 distinct props\n- Props typed as: TypeScript interfaces (not type aliases) exported from the component file. All props required by default — optional only when genuinely optional with a meaningful default\n- Prop patterns to avoid: boolean props for visual variants (use `variant: \'primary\' | \'outline\'` string unions); prop drilling beyond 2 levels (extract context or co-locate state)\n- Business logic in: `/lib/` utilities and `/app/api/` route handlers. Never directly in components — components handle rendering and user interaction delegation only',
  },
  {
    id: 'testing',
    title: 'Testing Stack',
    description: 'Tools for each test type, file conventions, and coverage scope',
    stem: '- Unit: Vitest for pure utility functions and business logic in `/lib/`\n- Integration: API route testing against a real Supabase test project\n- E2E: Playwright for critical user flows — sign in, create scroll, publish version, favorite, pull\n- Test files live in: `__tests__/` at repo root, mirroring source structure (e.g. `__tests__/lib/utils.test.ts`)\n- Mocks / fixtures: mock the Supabase JS client for unit tests (`vi.mock`); use a real Supabase test project for integration and E2E — never mock the DB in integration tests\n- Always tested: auth flows, scroll create and publish, RLS policy enforcement\n- Never tested: UI snapshots, shadcn component internals, Next.js framework routing behavior',
  },
  {
    id: 'build',
    title: 'Build and Bundling',
    description: 'Build tool, code-splitting strategy, and bundle constraints',
    stem: '- Build tool: Next.js built-in (Turbopack in development, webpack in production). No custom webpack config unless absolutely necessary\n- Code-split: automatically by Next.js per route. Additionally lazy-load: heavy markdown renderers, syntax highlighters, and editor libraries\n- Dev vs. production: source maps on in dev; Sentry source maps uploaded in production; verbose structured logs in dev, JSON-only in production\n- Never in production bundle: dev-only utilities, test fixtures, debug panels, or imports gated only by `NODE_ENV` checks that could leak',
  },
  {
    id: 'env_config',
    title: 'Environment Configuration',
    description: 'Variable declaration, validation at startup, and naming conventions',
    stem: '- Variables declared in: `.env.example` (committed, placeholder values with inline comments). Loaded from: `.env.local` (gitignored)\n- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_APP_URL`, `ANTHROPIC_API_KEY`\n- Optional: `NEXT_PUBLIC_SENTRY_DSN` — skipped gracefully if absent in local dev\n- Missing required config: API routes return 503 with a descriptive message — the app does not silently degrade or use fallback values\n- Naming: `NEXT_PUBLIC_` prefix for browser-safe vars only. `SUPABASE_SECRET_KEY` must never carry `NEXT_PUBLIC_` prefix — it must never appear in client-side code or the browser bundle\n- Never an env var: hardcoded secrets, feature flags (use DB or config file), dynamic config that belongs in the database',
  },
  {
    id: 'logging',
    title: 'Logging and Observability',
    description: 'Library, log levels, what is always logged, and what is never logged',
    stem: '- Library: custom structured logger at `/lib/logger.ts` (thin wrapper, no external logging dependency at MVP)\n- Format: JSON-structured with `level`, `event`, metadata, and `ts` (Unix timestamp) on every entry\n- Log levels: `error` = unhandled exceptions and failed writes; `warn` = degraded behavior or missing optional config; `info` = successful user actions\n- Always logged: every API route outcome (success and error), every publish action, every auth event with user ID\n- Error reporting: Sentry (`@sentry/nextjs`) captures and groups runtime exceptions — alerts fire on new error types, not on every occurrence\n- Never logged: passwords, tokens, session cookies, raw request bodies with credentials, or any PII beyond `user_id`',
  },
  {
    id: 'deployment',
    title: 'Deployment and Infrastructure',
    description: 'Hosting, deployment triggers, environment path, and rollback',
    stem: '- Hosting: Vercel. Deployment triggered by: push to `main` via GitHub integration — automatic, no manual step required\n- Environment path: local → production (no staging at MVP — see `.platform/scaling-plan.md` for when staging is added and what threshold triggers it)\n- Never deployed manually: production. All production deployments go through CI (lint + type check + build must pass)\n- Rollback: Vercel instant rollback to any previous deployment from the Vercel dashboard — target: identify and rollback within 2 minutes of a confirmed bad deploy',
  },
  {
    id: 'packages',
    title: 'Package Management',
    description: 'Chosen package manager, lockfile rules, and script conventions',
    stem: '- Package manager: npm. Do not use yarn or pnpm — `package-lock.json` consistency is required for CI reproducibility. Do not generate yarn commands\n- Lockfile: `package-lock.json` always committed. Never manually edited. Updated only via `npm install`, `npm update <package>`, or `npm ci` in CI\n- Required scripts in `package.json`: `dev` (start dev server), `build` (production build), `start` (serve production), `lint` (`eslint` + `tsc --noEmit`). These four must always be present',
  },
]

const SECTIONS_BY_TYPE: Record<ScrollType, StandardSection[]> = {
  general: GENERAL_SECTIONS,
  stack: STACK_SECTIONS,
  app: [],
}

const LOW_SECTION_THRESHOLD = 2

// ─── Component ─────────────────────────────────────────────────────────────────

interface GuidedEditorProps {
  scrollType: ScrollType
  autoExpand: boolean
  onContentUpdate: (content: string) => void
  onSave: (content: string) => Promise<void>
  isSaving: boolean
}

export interface GuidedEditorHandle {
  openReview: () => void
}

export const GuidedEditor = forwardRef<GuidedEditorHandle, GuidedEditorProps>(
  function GuidedEditor({ scrollType, autoExpand, onContentUpdate, onSave, isSaving }, ref) {
  const standardSections = SECTIONS_BY_TYPE[scrollType] ?? GENERAL_SECTIONS

  // Ordered list of all sections (standard + custom interleaved)
  const [sectionOrder, setSectionOrder] = useState<SectionRef[]>(
    () => standardSections.map((s) => ({ kind: 'standard' as const, id: s.id }))
  )
  // Metadata for custom sections
  const [customMeta, setCustomMeta] = useState<Record<string, CustomSectionMeta>>({})
  // Per-section state keyed by id (works for both standard and custom)
  const [included, setIncluded] = useState<Record<string, boolean>>(
    () => Object.fromEntries(standardSections.map((s) => [s.id, true]))
  )
  const [contents, setContents] = useState<Record<string, string>>(
    () => Object.fromEntries(standardSections.map((s) => [s.id, s.stem]))
  )
  const [nudges, setNudges] = useState<Record<string, NudgeState>>(
    () => Object.fromEntries(standardSections.map((s) => [s.id, { status: 'idle' }]))
  )
  const [reviewOpen, setReviewOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  useImperativeHandle(ref, () => ({ openReview: () => setReviewOpen(true) }))

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const setNudge = useCallback((id: string, state: NudgeState) => {
    setNudges((prev) => ({ ...prev, [id]: state }))
  }, [])

  // stem and sectionTitle passed in so this callback has no dependency on sections arrays
  const handleChange = useCallback(
    (id: string, value: string, stem: string | undefined, sectionTitle: string) => {
      setContents((prev) => ({ ...prev, [id]: value }))
      if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id])

      if (!value.trim()) { setNudge(id, { status: 'idle' }); return }
      if (stem !== undefined && value === stem) { setNudge(id, { status: 'idle' }); return }
      if (value.includes('__')) { setNudge(id, { status: 'unfilled' }); return }

      setNudge(id, { status: 'loading' })
      debounceTimers.current[id] = setTimeout(async () => {
        try {
          const res = await fetch('/api/ai/nudge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ section_title: sectionTitle, content: value }),
          })
          if (!res.ok) { setNudge(id, { status: 'clean' }); return }
          const data = (await res.json()) as { suggestion: string | null }
          setNudge(id, data.suggestion ? { status: 'suggestion', text: data.suggestion } : { status: 'clean' })
        } catch {
          setNudge(id, { status: 'clean' })
        }
      }, 1500)
    },
    [setNudge]
  )

  const addSection = useCallback((afterIndex: number) => {
    const id = `custom-${Date.now()}`
    setCustomMeta((prev) => ({ ...prev, [id]: { title: '', description: '' } }))
    setIncluded((prev) => ({ ...prev, [id]: true }))
    setContents((prev) => ({ ...prev, [id]: '' }))
    setNudges((prev) => ({ ...prev, [id]: { status: 'idle' } }))
    setSectionOrder((prev) => {
      const next = [...prev]
      next.splice(afterIndex + 1, 0, { kind: 'custom', id })
      return next
    })
  }, [])

  const removeSection = useCallback((id: string) => {
    setSectionOrder((prev) => prev.filter((ref) => ref.id !== id))
    setCustomMeta((prev) => { const r = { ...prev }; delete r[id]; return r })
    setIncluded((prev) => { const r = { ...prev }; delete r[id]; return r })
    setContents((prev) => { const r = { ...prev }; delete r[id]; return r })
    setNudges((prev) => { const r = { ...prev }; delete r[id]; return r })
  }, [])

  useEffect(() => {
    const timers = debounceTimers.current
    return () => Object.values(timers).forEach(clearTimeout)
  }, [])

  const compiledContent = useMemo(() => {
    return sectionOrder
      .filter((ref) => included[ref.id] ?? true)
      .map((ref) => {
        const title =
          ref.kind === 'standard'
            ? (standardSections.find((s) => s.id === ref.id)?.title ?? '')
            : (customMeta[ref.id]?.title || 'Untitled Section')
        return `# ${title}\n${contents[ref.id] ?? ''}`
      })
      .join('\n\n---\n\n')
  }, [sectionOrder, included, contents, customMeta, standardSections])

  useEffect(() => {
    onContentUpdate(compiledContent)
  }, [compiledContent, onContentUpdate])

  const includedSections: ReviewableSection[] = sectionOrder
    .filter((ref) => included[ref.id] ?? true)
    .map((ref) => ({
      id: ref.id,
      title:
        ref.kind === 'standard'
          ? (standardSections.find((s) => s.id === ref.id)?.title ?? '')
          : (customMeta[ref.id]?.title || 'Untitled Section'),
    }))

  const flaggedSections: ReviewableSection[] = includedSections.filter((s) => {
    const n = nudges[s.id]
    return !n || n.status === 'idle' || n.status === 'unfilled' || n.status === 'suggestion'
  })

  const sectionsList = (
    <div>
      {sectionOrder.map((ref, index) => {
        const isStandard = ref.kind === 'standard'
        const standard = isStandard ? standardSections.find((s) => s.id === ref.id) : null
        const title = isStandard ? (standard?.title ?? '') : (customMeta[ref.id]?.title ?? '')
        const description = isStandard ? (standard?.description ?? '') : (customMeta[ref.id]?.description ?? '')
        const stem = isStandard ? standard?.stem : undefined

        return (
          <div key={ref.id}>
            <GuidedSection
              id={ref.id}
              title={title}
              description={description}
              included={included[ref.id] ?? true}
              onToggle={() => setIncluded((prev) => ({ ...prev, [ref.id]: !(prev[ref.id] ?? true) }))}
              content={contents[ref.id] ?? ''}
              onChange={(value) => handleChange(ref.id, value, stem, title || 'Custom Section')}
              nudge={nudges[ref.id] ?? { status: 'idle' }}
              autoExpand={autoExpand}
              isCustom={!isStandard}
              onTitleChange={
                !isStandard
                  ? (v) => setCustomMeta((prev) => ({ ...prev, [ref.id]: { ...prev[ref.id], title: v } }))
                  : undefined
              }
              onDescriptionChange={
                !isStandard
                  ? (v) => setCustomMeta((prev) => ({ ...prev, [ref.id]: { ...prev[ref.id], description: v } }))
                  : undefined
              }
              onRemove={!isStandard ? () => removeSection(ref.id) : undefined}
            />
            <AddSectionButton onClick={() => addSection(index)} />
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      {/* Outer container: side-by-side on xl+ when preview is open */}
      <div className={cn(previewOpen && 'xl:flex xl:items-start xl:gap-6')}>
        {/* Sections column */}
        <div className={cn('min-w-0', previewOpen ? 'xl:flex-1' : 'mx-auto w-full max-w-4xl')}>
          {/* Sections header — mirrors RawPanel header for visual symmetry */}
          <div className="mb-3 flex items-center justify-between border-b border-border px-1 py-2">
            <span className="text-xs font-semibold text-muted-foreground">Guided sections</span>
            <button
              type="button"
              onClick={() => setPreviewOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {previewOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {previewOpen ? 'Close preview' : 'Preview'}
            </button>
          </div>

          {sectionsList}

          {/* Mobile preview: below sections, hidden on xl+ where the side panel shows */}
          {previewOpen && (
            <div className="mt-4 xl:hidden">
              <RawPanel compiledContent={compiledContent} />
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={() => setReviewOpen(true)}>Review & Save Draft</Button>
          </div>
        </div>

        {/* Desktop side preview panel — only rendered on xl+ */}
        {previewOpen && (
          <div className="sticky top-0 hidden w-full max-w-4xl shrink-0 self-start xl:block">
            <RawPanel compiledContent={compiledContent} />
          </div>
        )}
      </div>

      <ReviewDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        sections={includedSections}
        contents={contents}
        nudges={nudges}
        flaggedSections={flaggedSections}
        onSave={async () => { await onSave(compiledContent) }}
        isSaving={isSaving}
      />
    </>
  )
  }
)

// ─── Sub-components ────────────────────────────────────────────────────────────

function AddSectionButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="group relative flex h-7 items-center">
      <div className="absolute inset-x-0 flex items-center" aria-hidden>
        <div className="h-px flex-1 bg-border opacity-0 transition-opacity group-hover:opacity-100" />
        <button
          type="button"
          onClick={onClick}
          className="mx-2 flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground opacity-0 transition-all hover:bg-accent focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring group-hover:opacity-100"
        >
          <Plus className="h-3 w-3" />
          Add section
        </button>
        <div className="h-px flex-1 bg-border opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  )
}

function RawPanel({ compiledContent }: { compiledContent: string }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground">Raw output</span>
        <div className="group relative">
          <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground transition-colors group-hover:text-foreground" />
          <div className="pointer-events-none absolute right-0 top-5 z-50 w-64 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            Sections are delimited by <code className="font-mono">---</code> in the raw output. This is how the editor tracks section boundaries — don&apos;t remove them.
          </div>
        </div>
      </div>
      <pre className="max-h-[80vh] overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed text-muted-foreground">
        {compiledContent}
      </pre>
    </div>
  )
}

// ─── Review dialog ─────────────────────────────────────────────────────────────

interface ReviewDialogProps {
  open: boolean
  onClose: () => void
  sections: ReviewableSection[]
  contents: Record<string, string>
  nudges: Record<string, NudgeState>
  flaggedSections: ReviewableSection[]
  onSave: () => Promise<void>
  isSaving: boolean
}

function ReviewDialog({
  open,
  onClose,
  sections,
  contents,
  nudges,
  flaggedSections,
  onSave,
  isSaving,
}: ReviewDialogProps) {
  const [dialogError, setDialogError] = useState<string | null>(null)
  const tooFewSections = sections.length <= LOW_SECTION_THRESHOLD

  const handleSave = async () => {
    setDialogError(null)
    try {
      await onSave()
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col p-0">
        <div className="flex-none px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Review your scroll</DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 space-y-3 overflow-auto px-6 py-4">
          {dialogError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {dialogError}
            </div>
          )}

          {tooFewSections && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-warning">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Only {sections.length} section{sections.length !== 1 ? 's' : ''} included
              </div>
              <p className="mt-1 text-xs text-warning">
                A scroll this short is unlikely to meaningfully guide Claude. Consider going back and including more sections.
              </p>
            </div>
          )}

          {!tooFewSections && flaggedSections.length > 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-warning">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {flaggedSections.length} section{flaggedSections.length !== 1 ? 's' : ''} may need attention
              </div>
              <ul className="mt-2 space-y-1">
                {flaggedSections.map((s) => {
                  const nudge = nudges[s.id]
                  return (
                    <li key={s.id} className="text-xs text-warning">
                      <span className="font-medium">{s.title}</span>
                      {(!nudge || nudge.status === 'idle') && ' — still showing example content'}
                      {nudge?.status === 'unfilled' && ' — has unfilled blanks'}
                      {nudge?.status === 'suggestion' && `: ${nudge.text}`}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {!tooFewSections && flaggedSections.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              All {sections.length} sections look specific enough
            </div>
          )}

          <div className="space-y-2">
            {sections.map((s) => {
              const nudge = nudges[s.id]
              const flagged = !nudge || nudge.status === 'idle' || nudge.status === 'unfilled' || nudge.status === 'suggestion'
              return (
                <div
                  key={s.id}
                  className={cn('rounded-md border px-3 py-2.5', flagged ? 'border-warning/40' : 'border-border')}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    {flagged
                      ? <AlertCircle className="h-3.5 w-3.5 shrink-0 text-warning" />
                      : <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                    }
                    <span className="text-xs font-semibold">{s.title}</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">
                    {contents[s.id] ?? ''}
                  </pre>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-none border-t border-border px-6 py-4">
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>Edit</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Draft'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
