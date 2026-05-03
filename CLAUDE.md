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
- **Never render `<script>` tags directly in JSX** — React 19 warns "Scripts inside React
  components are never executed when rendering on the client" even for Server Components.
  Always use `next/script` with the appropriate strategy instead:
  - Inline FOUC/init scripts: `<Script id="…" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: code }}>`
  - Third-party scripts: `strategy="afterInteractive"` or `"lazyOnload"`
  - `beforeInteractive` extracts the script from React's tree entirely and hoists it to `<head>`

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

## Design Standards

Source: scroll-design-general (Personal Org Standard) v1.2

### Project Color Palette
All colors are CSS custom properties — never hardcode hex or oklch values in component files.

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--background` | oklch parchment warm white | near-black | Page background |
| `--foreground` | near-black | near-white | Body text |
| `--card` | warm white (slightly dimmer) | dark gray | Card surfaces |
| `--card-foreground` | near-black | near-white | Text on cards |
| `--primary` | near-black | near-white | Primary actions |
| `--primary-foreground` | near-white | near-black | Text on primary |
| `--secondary` | warm gray | dark gray | Secondary surfaces |
| `--muted` | warm gray | dark gray | Muted backgrounds |
| `--muted-foreground` | warm mid-gray | mid-gray | De-emphasized text |
| `--destructive` | red (oklch 0.577 0.245 27) | lighter red | Destructive actions |
| `--success` | green-600 (oklch 0.527 0.154 150) | green-400 | Success states (copy confirmation, etc.) |
| `--border` | warm light gray | white/10% | Borders |
| `--ring` | gray | gray | Focus rings |
| `--scroll-general` | indigo-600 | indigo-400 | Scroll type: general |
| `--scroll-stack` | violet-600 | violet-400 | Scroll type: stack |
| `--scroll-app` | emerald-600 | emerald-400 | Scroll type: app |

Tailwind semantic classes: `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`,
`bg-primary`, `text-primary-foreground`, `border-border`, `ring-ring`, etc.
Scroll type classes: `bg-scroll-general`, `bg-scroll-stack`, `bg-scroll-app` (and `-foreground` variants).

### Spacing Scale
4px base unit: 4, 8, 12, 16, 24, 32, 48, 64, 96px. No arbitrary values.
Map to Tailwind: `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-6`, `gap-8`, `gap-12`, `gap-16`, `gap-24`.

### Typography
- UI font: Geist Sans (`font-sans`, loaded via `next/font/google`)
- Mono font: Geist Mono (`font-mono`, loaded via `next/font/google`)
- Two typefaces only — no additional fonts without explicit instruction
- Body/UI labels: `text-sm` (14px), reading text: `text-base` (16px), line-height `leading-normal` (1.5)
- Heading weights: `font-semibold` for labels and emphasis, `font-bold` for primary headings only, `font-normal` for body
- Font sizes in `rem` via Tailwind utilities — never `px` for text
- Always provide a visible `<label>` for every input; placeholder text is supplementary only

### Border Radius Scale
Defined in `globals.css` via `--radius: 0.5rem` (8px) as the base:
- `rounded-sm` → `calc(var(--radius) - 4px)` = 4px
- `rounded-md` → `calc(var(--radius) - 2px)` = 6px
- `rounded-lg` → `var(--radius)` = 8px — default for cards, inputs, buttons
- `rounded-xl` → `calc(var(--radius) + 4px)` = 12px — modals, larger surfaces
- `rounded-full` → pills, avatars, badges
Never mix sharp and rounded elements without explicit rationale.

### Z-Index Scale
Named layers — use only these values (Tailwind z-index utilities map directly):
- `z-0` (0) — base content
- `z-10` (10) — slightly elevated (sticky sub-elements)
- `z-40` (40) — sticky headers / nav
- `z-50` (50) — dropdowns, popovers, tooltips, modals
- `z-[60]` (60) — toasts / notifications (above modals)
Never use arbitrary z-index values (`z-[9999]`, inline style z-index) — always use this scale.

### Project-Specific Overrides
- **Theme transition on `*`**: `globals.css` applies a blanket `transition-property: color, background-color, border-color, fill, stroke, box-shadow` on all elements under `prefers-reduced-motion: no-preference` for smooth dark mode switching. Component-level Tailwind transition classes override this with their own (faster) timing — this is intentional and not a CSS specificity bug.
- **Parchment background**: Light mode uses a warm off-white (`oklch(0.984 0.016 88)`) intentionally — not pure white. Do not replace with `white` or `#fff`.

### Enforcement Rules (Always Active)

**Design:**
- All inline elements (text next to icon/badge/tag/avatar) are vertically centered — `items-center` on the flex container, always
- All interactive states implemented: hover, focus, active, disabled, loading
- No hardcoded color values in component files — always use Tailwind semantic tokens
- No `outline: none` without a custom focus indicator replacing it — use `focus-visible:ring-*`
- No empty states left as blank containers — every list/table view has a designed empty state
- No horizontal scroll at any standard viewport width
- Content max-width enforced (`max-w-7xl` + `mx-auto`) — no edge-to-edge stretch on wide screens
- Transitions specify the property — `transition-colors`, `transition-transform`, never `transition-all`
- State changes animate only `transform` and `opacity` for motion effects — never `width`, `height`, `margin`, `padding`

**CSS / Tailwind:**
- All colors, spacing, radii, z-index via semantic tokens/Tailwind utilities — never hardcoded values
- No `!important` declarations
- No ID selectors for styling
- Every flex container has explicit `items-*` set
- `transition-all` is never used — always specify the property (`transition-colors`, `transition-transform`, etc.)
- No animating layout properties (`w-`, `h-`, `m-`, `p-`, `top-`, `left-`) for motion effects
- Font sizes in `rem` (Tailwind `text-*` utilities) — never inline `style={{ fontSize: '14px' }}`
- No `overflow-hidden` as a lazy fix — fix the layout causing the overflow

**Sustainability:**
- No one-off inline `style={}` patches — fix the system
- No silent deviations from established patterns — document intentional overrides in this file
- No shared token or base style modified without auditing downstream impact
- No copy-pasted style blocks between components — extract to a shared class or component
- Every intentional override documented here with rationale
