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
- **Never use a `<script>` tag (or `next/script`) for FOUC prevention or theme init.**
  React 19 warns "Scripts inside React components are never executed when rendering on the
  client" for any `<script>` tag anywhere in the React tree — Server Components, Client
  Components, `<head>`, `<body>`, and via `next/script` all trigger it without exception.
  The correct pattern is **cookie-based SSR theme detection**: write `scrolls-theme=dark`
  to `document.cookie` whenever the user toggles, then read `cookies().get('scrolls-theme')`
  in the async root layout and apply the `.dark` class server-side on `<html>`. No script
  tag required, no FOUC, no React 19 warning.
  - Third-party scripts: use `<Script strategy="afterInteractive">` or `<Script strategy="lazyOnload">` from `next/script`.

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

Source: scroll-design-general (Personal Org Standard) v2.0

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

### Layout Mode Registry
Every route has a layout mode. The mode determines max-width and column sizing — do not carry reading constraints into tool views.

| Route | Mode | Width contract |
|-------|------|---------------|
| `/` | Marketing | `max-w-7xl` containers; hero copy narrower |
| `/browse` | Catalogue | `max-w-7xl` centered — promotes to Tool (no max-width, `flex-1` panes) only when a filter sidebar is added alongside the grid |
| `/dashboard` | Tool | `max-w-7xl`, tabbed data views |
| `/[owner-slug]` | Reading/profile | `max-w-4xl`, single column |
| `/[owner-slug]/[scroll-slug]` | Reading | `max-w-4xl`, single column with metadata sidebar |
| `/docs` | Reading | `max-w-7xl` outer; sidebar (`w-48`) in left gutter (hidden below `lg`); reading content `max-w-3xl min-w-0`; mobile shows "On this page" list above content |
| `/scrolls/new` | Tool | No max-width — editor shell + guided editor + metadata sidebar, all `flex-1` |
| `/scrolls/[id]/edit` | Tool | No max-width — same as above |
| `/teams/[slug]` | Reading/profile | `max-w-4xl` |
| `/teams/[slug]/settings` | Editing | `max-w-2xl` form |

**Rule: when a feature adds a second side-by-side content pane, the view promotes to Shell.** Remove any `max-w-*` constraint from content columns. All panes use `flex-1 min-w-0`. Verify at 1440px and 1920px that both panes expand. Add the new route to this table.

### Layout Families — Two Only, Never Mixed

Every page belongs to exactly one family. Mixing them produces broken layouts that cannot be fixed by tweaking classes.

#### Family 1 — Content (page scrolls naturally)

The page body has natural height. Content determines how tall it is. The browser scrolls it.

```
<main class="flex flex-1 flex-col">          ← root layout (already set)
  <div class="mx-auto w-full max-w-X px-4 sm:px-6 py-12">
    ...page content...
  </div>
</main>
```

One container. One max-width. Nothing else. Max-width by purpose:

| Purpose | Class | px |
|---|---|---|
| Catalogue / dashboard (nav-aligned) | `max-w-7xl` | 1280 |
| Profile / reading with sidebar | `max-w-4xl` | 896 |
| Prose reading column | `max-w-3xl` | 768 |
| Forms / settings | `max-w-2xl` | 672 |

`max-w-7xl` is the reference — the nav uses it. Align full-width content pages to it.

**Hard rules for Content pages:**
- Never `overflow-hidden` or `flex-1` on the page root — it traps or hides scrollable content
- Never nest a second `mx-auto max-w-*` container inside the page container
- Never use padding to compensate for missing max-width (`2xl:px-24` is a smell — use `max-w-*` instead)

#### Family 2 — Shell (fills viewport height, no page scroll)

The shell fills exactly the remaining viewport after the nav. Content panes scroll internally. The page never scrolls.

```
<main class="flex flex-1 flex-col">                     ← root layout (already set)
  <div class="flex flex-1 overflow-hidden">              ← shell root
    <div class="flex-1 min-w-0 overflow-auto p-4 sm:p-6">   ← content pane
    <aside class="w-72 shrink-0 border-l overflow-auto">     ← fixed panel
  </div>
</main>
```

**Hard rules for Shell pages:**
- Never `max-w-*` on any content pane — panes must grow to fill available space
- Every content pane: `flex-1 min-w-0` — `min-w-0` prevents flex children from overflowing their container
- Every fixed panel (sidebar, drawer): `shrink-0` with an explicit `w-*` — never `flex-1`
- Never `overflow-hidden` inside `overflow-auto` — it traps content that needs to scroll
- Secondary panes collapse (`hidden xl:block`) when the primary column would drop below ~380px; primary fills the vacated space

#### Why mixing breaks things

- `mx-auto max-w-*` inside a Shell pane caps the pane width and leaves dead space at wide viewports — the two-column preview looks like one column
- `flex-1 overflow-hidden` on a Content page root clips content below the fold with no scroll — content disappears
- `w-full` or `max-w-*` on a Shell flex pane takes all available space, leaving zero width for sibling panes

### Component Defaults
Starting points that produce correct output without further instruction:
- **Card padding**: `p-6` default, `p-4` compact
- **Button padding**: `px-4 py-2 text-sm` (md), `px-3 py-1.5 text-sm` (sm)
- **Icon + label gap**: `gap-2`, always `items-center` on the flex container
- **Form field spacing**: `space-y-4` between fields, `space-y-1.5` between label and input
- **Section spacing**: `gap-8` or `gap-12` between major content blocks
- **Empty state**: `flex flex-col items-center py-12 text-center` — icon (`h-8 w-8 text-muted-foreground/50`) + `font-medium` heading + `text-sm text-muted-foreground mt-1` description + optional CTA `mt-6`
- **Skeleton**: `animate-pulse bg-muted rounded` — shape must match the content it replaces
- **Sticky chrome background**: always `bg-card` or `bg-background` (solid) — never transparent over scrolled content

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
- Max-width is mode-dependent — see Layout Mode Registry. Never apply a reading max-width to a tool-mode view. Tool mode fills available width; reading mode constrains line length.
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
- `min-width: 0` on all flex children that contain text — prevents text from forcing parent to overflow

**Layout:**
- Tool-mode views have no reading max-width — all content panes use `flex-1 min-w-0`, not fixed widths
- No fixed pixel width (`w-80`, `w-64`, etc.) on any column containing dynamic or user-authored text
- All layouts verified at 375px, 768px, 1280px, 1440px, 1920px — tool-mode layouts must expand between 1280px and 1920px, not hit a cap
- Secondary panes collapse at the breakpoint where they would become unreadably narrow (<380px) rather than cramming — primary pane fills the vacated space

**Sustainability:**
- No one-off inline `style={}` patches — fix the system
- No silent deviations from established patterns — document intentional overrides in this file
- No shared token or base style modified without auditing downstream impact
- No copy-pasted style blocks between components — extract to a shared class or component
- Every intentional override documented here with rationale
