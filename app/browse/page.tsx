import { createServerClient } from '@/lib/supabase/server'
import { ScrollCard } from '@/components/scroll/scroll-card'
import { ScrollRow } from '@/components/scroll/scroll-row'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TypeBadge } from '@/components/scroll/type-badge'
import { LayoutGrid, List, Search, SearchX } from 'lucide-react'
import type { Scroll, ScrollType } from '@/types'
import { cn } from '@/lib/utils'

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string
    type?: ScrollType
    view?: 'card' | 'list'
    sort?: 'pulls' | 'favorites' | 'updated'
  }>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { q, type, view = 'card', sort = 'pulls' } = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .from('scrolls')
    .select(`
      *,
      owner_user:users!scrolls_user_id_fkey(id, display_name, avatar_url),
      owner_team:teams!scrolls_team_id_fkey(id, name, slug, avatar_url),
      scroll_tags(tag_id, tags(id, name))
    `)
    .eq('is_public', true)
    .eq('is_published', true)
    .is('deleted_at', null)
    .limit(48)

  if (type) query = query.eq('scroll_type', type)
  if (q) query = query.ilike('title', `%${q}%`)

  if (sort === 'pulls') query = query.order('pull_count', { ascending: false })
  else if (sort === 'favorites') query = query.order('favorite_count', { ascending: false })
  else query = query.order('updated_at', { ascending: false })

  const { data: rawScrolls } = await query
  type RawScroll = Record<string, unknown> & {
    scroll_tags?: Array<{ tags: { id: string; name: string; usage_count: number; created_at: string } | null }> | null
  }
  const scrolls: Scroll[] = (rawScrolls ?? []).map((s) => ({
    ...(s as unknown as Scroll),
    tags: ((s as RawScroll).scroll_tags ?? []).map((st) => st.tags).filter((t): t is NonNullable<typeof t> => t !== null),
  }))

  const SCROLL_TYPES: ScrollType[] = ['general', 'stack', 'app']

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      {/* Header: title + search + view toggle — all in one row */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
        <h1 className="shrink-0 text-2xl font-bold">Browse</h1>
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <form>
              <Input
                name="q"
                defaultValue={q}
                placeholder="Search specs…"
                className="pl-9"
              />
            </form>
          </div>
          <div className="flex items-center rounded-lg border border-border p-1">
            <Button
              variant={view === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              asChild
            >
              <a href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(type ? { type } : {}), sort, view: 'card' })}`}>
                <LayoutGrid className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              asChild
            >
              <a href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(type ? { type } : {}), sort, view: 'list' })}`}>
                <List className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Type filter chips — same width as header row above */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <a
          href={`?${new URLSearchParams({ ...(q ? { q } : {}), sort, view })}`}
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            !type
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          All types
        </a>
        {SCROLL_TYPES.map((t) => (
          <a
            key={t}
            href={`?${new URLSearchParams({ ...(q ? { q } : {}), type: t, sort, view })}`}
            className={cn(
              'rounded-full transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              type === t ? 'opacity-100' : 'opacity-40 hover:opacity-70'
            )}
          >
            <TypeBadge type={t} />
          </a>
        ))}
      </div>

      {/* Results — grid shares the full container width */}
      {scrolls.length === 0 ? (
        <div>
          {(q || type) && (
            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <SearchX className="h-4 w-4 shrink-0" />
              <span>No specs found — try adjusting your search or filters.</span>
            </div>
          )}
          {view === 'card' ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 opacity-40 pointer-events-none select-none">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="h-2 bg-muted" />
                  <div className="space-y-3 p-4">
                    <div className={cn('h-4 rounded bg-muted', i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-2/3' : 'w-4/5')} />
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-muted" />
                      <div className="h-3 w-1/4 rounded bg-muted" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3 rounded bg-muted" />
                      <div className="h-3 w-5/6 rounded bg-muted" />
                    </div>
                    <div className="flex gap-1">
                      <div className="h-4 w-12 rounded-full bg-muted" />
                      <div className="h-4 w-16 rounded-full bg-muted" />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="h-5 w-20 rounded-full bg-muted" />
                      <div className="flex gap-3">
                        <div className="h-3 w-8 rounded bg-muted" />
                        <div className="h-3 w-8 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2 opacity-40 pointer-events-none select-none">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
                  <div className="h-8 w-1 shrink-0 rounded-full bg-muted" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className={cn('h-4 rounded bg-muted', i % 2 === 0 ? 'w-2/3' : 'w-1/2')} />
                    <div className="h-3 w-1/3 rounded bg-muted" />
                  </div>
                  <div className="hidden items-center gap-4 sm:flex">
                    <div className="h-3 w-8 rounded bg-muted" />
                    <div className="h-3 w-8 rounded bg-muted" />
                  </div>
                  <div className="h-4 w-4 shrink-0 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : view === 'card' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {scrolls.map((scroll) => {
            const ownerSlug =
              scroll.owner_type === 'user'
                ? (scroll.owner_user as { display_name: string } | undefined)?.display_name?.toLowerCase().replace(/\s+/g, '-') ?? 'unknown'
                : (scroll.owner_team as { slug: string } | undefined)?.slug ?? 'unknown'
            return <ScrollCard key={scroll.id} scroll={scroll} ownerSlug={ownerSlug} />
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {scrolls.map((scroll) => {
            const ownerSlug =
              scroll.owner_type === 'user'
                ? (scroll.owner_user as { display_name: string } | undefined)?.display_name?.toLowerCase().replace(/\s+/g, '-') ?? 'unknown'
                : (scroll.owner_team as { slug: string } | undefined)?.slug ?? 'unknown'
            return <ScrollRow key={scroll.id} scroll={scroll} ownerSlug={ownerSlug} />
          })}
        </div>
      )}
    </div>
  )
}
