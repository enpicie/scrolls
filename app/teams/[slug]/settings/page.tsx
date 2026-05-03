import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, UserMinus, Crown } from 'lucide-react'

interface TeamSettingsPageProps {
  params: Promise<{ slug: string }>
}

export default async function TeamSettingsPage({ params }: TeamSettingsPageProps) {
  const { slug } = await params
  const supabase = await createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/')

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (!team) notFound()

  // Must be team admin
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', team.id)
    .eq('user_id', authUser.id)
    .single()

  if (!membership || membership.role !== 'admin') redirect(`/teams/${slug}`)

  const { data: members } = await supabase
    .from('team_members')
    .select('user_id, role, users(id, display_name, avatar_url, email)')
    .eq('team_id', team.id)

  const { data: pendingInvitations } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('team_id', team.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="-ml-2 mb-4" asChild>
          <Link href={`/teams/${slug}`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to {team.name}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Team Settings</h1>
        <p className="text-muted-foreground">{team.name}</p>
      </div>

      {/* Members */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Members</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          {(members ?? []).map((m, i) => {
            type MemberUser = { id: string; display_name: string; avatar_url: string | null; email: string }
            const raw = m.users as MemberUser | MemberUser[] | null
            const u = Array.isArray(raw) ? raw[0] ?? null : raw
            if (!u) return null
            return (
              <div
                key={m.user_id}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={u.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{u.display_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{u.display_name}</span>
                    {m.role === 'admin' && (
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{u.email}</span>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                  {m.role}
                </span>
                {m.user_id !== authUser.id && (
                  <form action={`/api/teams/${slug}/members/${m.user_id}`} method="POST">
                    <input type="hidden" name="_method" value="DELETE" />
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Pending invitations */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Pending Invitations</h2>
        {(!pendingInvitations || pendingInvitations.length === 0) ? (
          <p className="text-sm text-muted-foreground">No pending invitations.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {pendingInvitations.map((inv, i) => (
              <div
                key={inv.id}
                className={`flex items-center justify-between gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
              >
                <div>
                  <span className="text-sm font-medium">
                    {inv.email ?? `@${inv.github_username}`}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                    {inv.role}
                  </span>
                  <form action={`/api/teams/${slug}/invitations/${inv.id}`} method="POST">
                    <input type="hidden" name="_method" value="DELETE" />
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs">
                      Cancel
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator className="mb-8" />

      {/* Invite form */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Invite a member</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Invite by email or GitHub username. They will receive a pending invitation valid for 7 days.
        </p>
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
          Invite form — coming soon
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Danger zone */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-destructive">Danger Zone</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Dissolving a team cannot be undone. The team must have no owned Scrolls before it can be dissolved.
        </p>
        <Button variant="destructive" disabled>
          Dissolve team
        </Button>
      </section>
    </div>
  )
}
