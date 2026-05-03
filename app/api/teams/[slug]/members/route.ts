import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// POST /api/teams/[slug]/members — invite a member (admin only)
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { email, github_username, role } = body

  if (!email && !github_username) {
    return Response.json({ error: 'Provide at least one of: email, github_username' }, { status: 400 })
  }

  // Resolve team
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (!team) return Response.json({ error: 'Team not found' }, { status: 404 })

  // Confirm caller is an admin
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', team.id)
    .eq('user_id', session.user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('team_invitations')
    .insert({
      team_id: team.id,
      invited_by: session.user.id,
      email: email ?? null,
      github_username: github_username ?? null,
      role: role ?? 'member',
    })
    .select()
    .single()

  if (error) {
    logger.error('team_invite_error', error, { userId: session.user.id, teamId: team.id })
    return Response.json({ error: 'Failed to create invitation' }, { status: 500 })
  }

  logger.info('team_member_invited', { userId: session.user.id, teamId: team.id, email, github_username })
  return Response.json(data, { status: 201 })
}
