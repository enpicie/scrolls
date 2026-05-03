import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// POST /api/scrolls/[id]/publish — publish a new version
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { version, content, changelog, set_active } = body

  if (!version || !content) {
    return Response.json({ error: 'Missing required fields: version, content' }, { status: 400 })
  }

  // Confirm ownership
  const { data: scroll } = await supabase
    .from('scrolls')
    .select('user_id, team_id, active_version_id')
    .eq('id', id)
    .single()

  if (!scroll) return Response.json({ error: 'Not found' }, { status: 404 })

  const isOwner = scroll.user_id === session.user.id
  let isTeamMember = false
  if (scroll.team_id) {
    const { data } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', scroll.team_id)
      .eq('user_id', session.user.id)
      .single()
    isTeamMember = !!data
  }

  if (!isOwner && !isTeamMember) return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Insert new version
  const { data: newVersion, error: versionError } = await supabase
    .from('scroll_versions')
    .insert({
      scroll_id: id,
      version,
      content,
      changelog: changelog ?? null,
      published_by: session.user.id,
    })
    .select()
    .single()

  if (versionError) {
    logger.error('scroll_publish_version_error', versionError, { userId: session.user.id, scrollId: id })
    if (versionError.code === '23505') return Response.json({ error: 'Version already exists' }, { status: 409 })
    return Response.json({ error: 'Failed to create version' }, { status: 500 })
  }

  // Update scroll: set published, optionally update active version
  const updateActive = set_active !== false // default true on publish
  const { error: scrollError } = await supabase
    .from('scrolls')
    .update({
      is_published: true,
      active_version_id: updateActive ? newVersion.id : scroll.active_version_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (scrollError) {
    logger.error('scroll_publish_update_error', scrollError, { userId: session.user.id, scrollId: id })
    return Response.json({ error: 'Version created but failed to update scroll' }, { status: 500 })
  }

  // Record version event
  await supabase.from('scroll_version_events').insert({
    scroll_id: id,
    version_id: newVersion.id,
    event_type: 'published',
    actor_id: session.user.id,
  })

  logger.info('scroll_version_published', { userId: session.user.id, scrollId: id, version })
  return Response.json(newVersion, { status: 201 })
}
