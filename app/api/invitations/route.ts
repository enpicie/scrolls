import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// GET /api/invitations — get current user's pending invitations
export async function GET() {
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Match invitations by email or github_username
  const { data: profile } = await supabase
    .from('users')
    .select('email, github_username')
    .eq('id', session.user.id)
    .single()

  if (!profile) return Response.json([])

  const { data, error } = await supabase
    .from('team_invitations')
    .select('*, team:teams(id, name, slug, avatar_url)')
    .eq('status', 'pending')
    .or(
      [
        profile.email ? `email.eq.${profile.email}` : null,
        profile.github_username ? `github_username.eq.${profile.github_username}` : null,
      ]
        .filter(Boolean)
        .join(',')
    )
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('invitations_list_error', error, { userId: session.user.id })
    return Response.json({ error: 'Failed to fetch invitations' }, { status: 500 })
  }

  return Response.json(data)
}
