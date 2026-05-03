import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollCard } from '@/components/scroll/scroll-card'
import { Settings } from 'lucide-react'
import type { Scroll } from '@/types'

interface TeamProfilePageProps {
  params: Promise<{ slug: string }>
}

export default async function TeamProfilePage({ params }: TeamProfilePageProps) {
  const { slug } = await params
  const supabase = await createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (!team) notFound()

  // Check if current user is a team admin
  let isAdmin = false
  if (authUser) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team.id)
      .eq('user_id', authUser.id)
      .single()
    isAdmin = membership?.role === 'admin'
  }

  const { data: members } = await supabase
    .from('team_members')
    .select('user_id, users(id, display_name, avatar_url)')
    .eq('team_id', team.id)

  const { data: rawScrolls } = await supabase
    .from('scrolls')
    .select('*, scroll_tags(tag_id, tags(id, name))')
    .eq('team_id', team.id)
    .eq('is_public', true)
    .eq('is_published', true)
    .is('deleted_at', null)
    .order('pull_count', { ascending: false })

  type RawScroll = Record<string, unknown> & {
    scroll_tags?: Array<{ tags: { id: string; name: string; usage_count: number; created_at: string } | null }> | null
  }
  const scrolls: Scroll[] = (rawScrolls ?? []).map((s) => ({
    ...(s as unknown as Scroll),
    owner_team: team as Scroll['owner_team'],
    tags: ((s as RawScroll).scroll_tags ?? []).map((st) => st.tags).filter((t): t is NonNullable<typeof t> => t !== null),
  }))

  const initials = team.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Team header */}
      <div className="mb-10 flex items-start gap-5">
        <Avatar className="h-16 w-16">
          <AvatarImage src={team.avatar_url ?? undefined} alt={team.name} />
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">{team.name}</h1>
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/teams/${slug}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            )}
          </div>
          {team.bio && <p className="mt-1 text-muted-foreground">{team.bio}</p>}

          {/* Members */}
          {members && members.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex -space-x-2">
                {members.slice(0, 5).map((m) => {
                  type MemberUser = { id: string; display_name: string; avatar_url: string | null }
                  const raw = m.users as MemberUser | MemberUser[] | null
                  const u = Array.isArray(raw) ? raw[0] ?? null : raw
                  if (!u) return null
                  return (
                    <Avatar key={m.user_id} className="h-7 w-7 border-2 border-background">
                      <AvatarImage src={u.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">{u.display_name[0]}</AvatarFallback>
                    </Avatar>
                  )
                })}
              </div>
              <span className="text-sm text-muted-foreground">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scrolls */}
      <h2 className="mb-4 text-lg font-semibold">Published Scrolls</h2>
      {scrolls.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          No published scrolls yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scrolls.map((scroll) => (
            <ScrollCard key={scroll.id} scroll={scroll} ownerSlug={slug} />
          ))}
        </div>
      )}
    </div>
  )
}
