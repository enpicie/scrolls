import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// POST /api/invitations/[id]/accept — accept an invitation
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invitation } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('id', id)
    .eq('status', 'pending')
    .single()

  if (!invitation) return Response.json({ error: 'Invitation not found or already resolved' }, { status: 404 })

  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from('team_invitations').update({ status: 'expired' }).eq('id', id)
    return Response.json({ error: 'Invitation has expired' }, { status: 410 })
  }

  // Add member to team
  const { error: memberError } = await supabase.from('team_members').insert({
    team_id: invitation.team_id,
    user_id: session.user.id,
    role: invitation.role,
  })

  if (memberError && memberError.code !== '23505') {
    logger.error('invitation_accept_member_error', memberError, { userId: session.user.id, invitationId: id })
    return Response.json({ error: 'Failed to add to team' }, { status: 500 })
  }

  await supabase.from('team_invitations').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', id)

  logger.info('invitation_accepted', { userId: session.user.id, invitationId: id, teamId: invitation.team_id })
  return Response.json({ ok: true })
}
