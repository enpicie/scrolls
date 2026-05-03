import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// POST /api/teams — create a team
export async function POST(request: Request) {
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, slug, bio } = body

  if (!name || !slug) {
    return Response.json({ error: 'Missing required fields: name, slug' }, { status: 400 })
  }

  // Create team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ name, slug, bio: bio ?? null, created_by: session.user.id })
    .select()
    .single()

  if (teamError) {
    logger.error('team_create_error', teamError, { userId: session.user.id })
    if (teamError.code === '23505') return Response.json({ error: 'A team with this slug already exists' }, { status: 409 })
    return Response.json({ error: 'Failed to create team' }, { status: 500 })
  }

  // Add creator as admin
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({ team_id: team.id, user_id: session.user.id, role: 'admin' })

  if (memberError) {
    logger.error('team_add_creator_error', memberError, { userId: session.user.id, teamId: team.id })
    // Team was created but creator wasn't added — still return team
  }

  logger.info('team_created', { userId: session.user.id, teamId: team.id, slug })
  return Response.json(team, { status: 201 })
}
