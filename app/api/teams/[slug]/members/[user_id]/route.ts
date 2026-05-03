import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

async function resolveAdminAccess(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  slug: string,
  actorId: string
): Promise<{ teamId: string } | null> {
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (!team) return null

  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', team.id)
    .eq('user_id', actorId)
    .single()

  if (!membership || membership.role !== 'admin') return null

  return { teamId: team.id }
}

// DELETE /api/teams/[slug]/members/[user_id] — remove a member (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string; user_id: string }> }
) {
  const { slug, user_id } = await params
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await resolveAdminAccess(supabase, slug, session.user.id)
  if (!access) return Response.json({ error: 'Forbidden' }, { status: 403 })

  if (user_id === session.user.id) {
    return Response.json({ error: 'Cannot remove yourself' }, { status: 400 })
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', access.teamId)
    .eq('user_id', user_id)

  if (error) {
    logger.error('team_member_remove_error', error, { userId: session.user.id, teamId: access.teamId, targetUserId: user_id })
    return Response.json({ error: 'Failed to remove member' }, { status: 500 })
  }

  logger.info('team_member_removed', { userId: session.user.id, teamId: access.teamId, targetUserId: user_id })
  return new Response(null, { status: 204 })
}

// PATCH /api/teams/[slug]/members/[user_id] — update member role (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; user_id: string }> }
) {
  const { slug, user_id } = await params
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await resolveAdminAccess(supabase, slug, session.user.id)
  if (!access) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { role } = body

  if (role !== 'admin' && role !== 'member') {
    return Response.json({ error: 'Invalid role — must be admin or member' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('team_members')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('team_id', access.teamId)
    .eq('user_id', user_id)
    .select()
    .single()

  if (error) {
    logger.error('team_member_role_update_error', error, { userId: session.user.id, teamId: access.teamId, targetUserId: user_id })
    return Response.json({ error: 'Failed to update role' }, { status: 500 })
  }

  logger.info('team_member_role_updated', { userId: session.user.id, teamId: access.teamId, targetUserId: user_id, role })
  return Response.json(data)
}
