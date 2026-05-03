import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// POST /api/invitations/[id]/decline — decline an invitation
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invitation } = await supabase
    .from('team_invitations')
    .select('id')
    .eq('id', id)
    .eq('status', 'pending')
    .single()

  if (!invitation) return Response.json({ error: 'Invitation not found or already resolved' }, { status: 404 })

  await supabase.from('team_invitations').update({ status: 'declined', updated_at: new Date().toISOString() }).eq('id', id)

  logger.info('invitation_declined', { userId: session.user.id, invitationId: id })
  return Response.json({ ok: true })
}
