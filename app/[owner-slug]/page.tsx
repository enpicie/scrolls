import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollCard } from '@/components/scroll/scroll-card'
import { Globe, ScrollText } from 'lucide-react'
import type { Scroll } from '@/types'

interface PublisherProfilePageProps {
  params: Promise<{ 'owner-slug': string }>
}

export default async function PublisherProfilePage({ params }: PublisherProfilePageProps) {
  const { 'owner-slug': ownerSlug } = await params
  const supabase = await createServerClient()

  // Try matching a user by display_name-derived slug, or a team by slug
  const [{ data: users }, { data: team }] = await Promise.all([
    supabase.from('users').select('*').is('deleted_at', null),
    supabase.from('teams').select('*').eq('slug', ownerSlug).is('deleted_at', null).single(),
  ])

  // Match user by slugified display_name
  const user = users?.find(
    (u) =>
      u.display_name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') === ownerSlug
  )

  if (!user && !team) notFound()

  const isTeam = !user && !!team
  const ownerId = isTeam ? team!.id : user!.id
  const ownerName = isTeam ? team!.name : user!.display_name
  const ownerAvatar = isTeam ? team!.avatar_url : user!.avatar_url
  const ownerBio = isTeam ? team!.bio : user!.bio
  const ownerWebsite = isTeam ? null : user!.website_url

  const { data: rawScrolls } = await supabase
    .from('scrolls')
    .select(`
      *,
      scroll_tags(tag_id, tags(id, name))
    `)
    .eq(isTeam ? 'team_id' : 'user_id', ownerId)
    .eq('is_public', true)
    .eq('is_published', true)
    .is('deleted_at', null)
    .order('pull_count', { ascending: false })

  type RawScroll = Record<string, unknown> & {
    scroll_tags?: Array<{ tags: { id: string; name: string; usage_count: number; created_at: string } | null }> | null
  }
  const scrolls: Scroll[] = (rawScrolls ?? []).map((s) => ({
    ...(s as unknown as Scroll),
    owner_user: isTeam ? undefined : (user as Scroll['owner_user']),
    owner_team: isTeam ? (team as Scroll['owner_team']) : undefined,
    tags: ((s as RawScroll).scroll_tags ?? []).map((st) => st.tags).filter((t): t is NonNullable<typeof t> => t !== null),
  }))

  const totalPulls = scrolls.reduce((acc, s) => acc + s.pull_count, 0)
  const totalFavorites = scrolls.reduce((acc, s) => acc + s.favorite_count, 0)

  const initials = ownerName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Profile header */}
      <div className="mb-10 flex items-start gap-5">
        <Avatar className="h-16 w-16">
          <AvatarImage src={ownerAvatar ?? undefined} alt={ownerName} />
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{ownerName}</h1>
          {ownerBio && <p className="mt-1 text-muted-foreground">{ownerBio}</p>}
          {ownerWebsite && (
            <a
              href={ownerWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              {ownerWebsite.replace(/^https?:\/\//, '')}
            </a>
          )}
          <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">{totalPulls.toLocaleString()}</strong> total pulls
            </span>
            <span>
              <strong className="text-foreground">{totalFavorites.toLocaleString()}</strong> total favorites
            </span>
          </div>
        </div>
      </div>

      {/* Scrolls */}
      <h2 className="mb-4 text-lg font-semibold">Published Scrolls</h2>
      {scrolls.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-8 py-16 text-center">
          <ScrollText className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium">No published scrolls yet</p>
          <p className="mt-1 text-sm text-muted-foreground">This publisher hasn&apos;t released any specs yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scrolls.map((scroll) => (
            <ScrollCard key={scroll.id} scroll={scroll} ownerSlug={ownerSlug} />
          ))}
        </div>
      )}
    </div>
  )
}
