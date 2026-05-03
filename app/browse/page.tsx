import { createServerClient } from '@/lib/supabase/server'
import { ScrollCard } from '@/components/scroll/scroll-card'
import { ScrollRow } from '@/components/scroll/scroll-row'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TypeBadge } from '@/components/scroll/type-badge'
import { LayoutGrid, List, Search } from 'lucide-react'
import type { Scroll, ScrollType } from '@/types'

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

  const { data: topTags } = await supabase
    .from('tags')
    .select('id, name, usage_count')
    .order('usage_count', { ascending: false })
    .limit(30)

  const SCROLL_TYPES: ScrollType[] = ['general', 'stack', 'app']

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Browse</h1>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
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

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="mb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Type
            </h3>
            <div className="flex flex-col gap-1">
              <a
                href={`?${new URLSearchParams({ ...(q ? { q } : {}), sort, view })}`}
                className={`rounded-md px-2 py-1.5 text-sm transition hover:bg-accent ${!type ? 'bg-accent font-medium' : ''}`}
              >
                All types
              </a>
              {SCROLL_TYPES.map((t) => (
                <a
                  key={t}
                  href={`?${new URLSearchParams({ ...(q ? { q } : {}), type: t, sort, view })}`}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-accent ${type === t ? 'bg-accent font-medium' : ''}`}
                >
                  <TypeBadge type={t} size="sm" />
                </a>
              ))}
            </div>
          </div>

          {topTags && topTags.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-1">
                {topTags.slice(0, 20).map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Results */}
        <div className="flex-1">
          {scrolls.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
              No specs found.
            </div>
          ) : view === 'card' ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      </div>
    </div>
  )
}
