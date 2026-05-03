import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TypeBadge } from '@/components/scroll/type-badge'
import { Separator } from '@/components/ui/separator'
import { Download, Heart, ExternalLink, Clock } from 'lucide-react'
import type { Scroll } from '@/types'

interface ScrollDetailPageProps {
  params: Promise<{ 'owner-slug': string; 'scroll-slug': string }>
}

export default async function ScrollDetailPage({ params }: ScrollDetailPageProps) {
  const { 'owner-slug': ownerSlug, 'scroll-slug': scrollSlug } = await params
  const supabase = await createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  // Resolve owner (user or team)
  const [{ data: users }, { data: team }] = await Promise.all([
    supabase.from('users').select('id, display_name, avatar_url').is('deleted_at', null),
    supabase.from('teams').select('id, name, slug, avatar_url').eq('slug', ownerSlug).is('deleted_at', null).single(),
  ])

  const ownerUser = users?.find(
    (u) =>
      u.display_name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') === ownerSlug
  )

  const isTeam = !ownerUser && !!team
  const ownerId = isTeam ? team!.id : ownerUser?.id

  if (!ownerId) notFound()

  const { data: scroll } = await supabase
    .from('scrolls')
    .select(`
      *,
      active_version:scroll_versions!scrolls_active_version_id_fkey(*),
      scroll_tags(tag_id, tags(id, name, usage_count))
    `)
    .eq('slug', scrollSlug)
    .eq(isTeam ? 'team_id' : 'user_id', ownerId)
    .eq('is_public', true)
    .is('deleted_at', null)
    .single()

  if (!scroll) notFound()

  const tags =
    (scroll.scroll_tags as Array<{ tags: { id: string; name: string } | null }> | null)
      ?.map((st) => st.tags)
      .filter(Boolean) ?? []

  const ownerName = isTeam ? team!.name : ownerUser!.display_name
  const ownerAvatar = isTeam ? team!.avatar_url : ownerUser!.avatar_url
  const ownerInitial = ownerName[0]?.toUpperCase() ?? '?'

  const scrollTyped = scroll as unknown as Scroll

  // Check if current user has favorited
  let isFavorited = false
  if (authUser) {
    const { data: fav } = await supabase
      .from('user_favorites')
      .select('scroll_id')
      .eq('user_id', authUser.id)
      .eq('scroll_id', scroll.id)
      .single()
    isFavorited = !!fav
  }

  const content = (scroll.active_version as { content?: string } | null)?.content ?? null

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header color band */}
      <div
        className={`mb-6 rounded-xl p-6 text-white ${
          scroll.scroll_type === 'general'
            ? 'bg-scroll-general'
            : scroll.scroll_type === 'stack'
            ? 'bg-scroll-stack'
            : 'bg-scroll-app'
        }`}
      >
        <div className="mb-3 flex items-center gap-2">
          <TypeBadge
            type={scrollTyped.scroll_type}
            className="bg-white/20 text-white border-0"
          />
          {scroll.content_mode === 'repo' && scroll.repo_url && (
            <a
              href={`${scroll.repo_url}/blob/${scroll.repo_branch}/${scroll.repo_file_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs text-white hover:bg-white/30"
            >
              <ExternalLink className="h-3 w-3" />
              Source
            </a>
          )}
        </div>
        <h1 className="text-2xl font-bold">{scroll.title}</h1>
        <p className="mt-1 text-white/80">{scroll.description}</p>
        <div className="mt-4 flex items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={ownerAvatar ?? undefined} />
            <AvatarFallback className="text-[10px]">{ownerInitial}</AvatarFallback>
          </Avatar>
          <Link
            href={`/${ownerSlug}`}
            className="text-sm text-white/90 hover:text-white transition-colors"
          >
            {ownerName}
          </Link>
        </div>
      </div>

      {/* AI summary */}
      {scroll.ai_summary && (
        <div className="mb-6 rounded-lg border border-border bg-muted/50 px-5 py-4">
          <p className="text-sm font-medium text-muted-foreground">AI Summary</p>
          <p className="mt-1 text-sm">{scroll.ai_summary}</p>
        </div>
      )}

      {/* Metadata row */}
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Download className="h-4 w-4" />
          {scroll.pull_count.toLocaleString()} pulls
        </span>
        <span className="flex items-center gap-1">
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
          {scroll.favorite_count.toLocaleString()} favorites
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Updated {new Date(scroll.updated_at).toLocaleDateString()}
        </span>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag!.id}
                className="rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                {tag!.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mb-8 flex items-center gap-2">
        <form action={`/api/scrolls/${scroll.id}/pull`} method="POST">
          <Button type="submit">
            <Download className="mr-2 h-4 w-4" />
            Pull
          </Button>
        </form>
        {authUser && (
          <form action={isFavorited ? `/api/favorites/${scroll.id}` : '/api/favorites'} method="POST">
            {!isFavorited && <input type="hidden" name="scroll_id" value={scroll.id} />}
            {isFavorited && <input type="hidden" name="_method" value="DELETE" />}
            <Button variant="outline" type="submit">
              <Heart className={`mr-2 h-4 w-4 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
              {isFavorited ? 'Unfavorite' : 'Favorite'}
            </Button>
          </form>
        )}
      </div>

      <Separator className="mb-8" />

      {/* Content */}
      {content ? (
        <div className="prose prose-zinc max-w-none dark:prose-invert">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{content}</pre>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          No content published yet.
        </div>
      )}
    </div>
  )
}
