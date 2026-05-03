import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

async function resolveOwnership(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  scrollId: string,
  userId: string
): Promise<boolean> {
  const { data: scroll } = await supabase
    .from('scrolls')
    .select('user_id, team_id')
    .eq('id', scrollId)
    .single()

  if (!scroll) return false
  if (scroll.user_id === userId) return true

  if (scroll.team_id) {
    const { data } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', scroll.team_id)
      .eq('user_id', userId)
      .single()
    return !!data
  }
  return false
}

// GET /api/scrolls/[id] — get a single scroll
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('scrolls')
    .select('*, active_version:scroll_versions!scrolls_active_version_id_fkey(*), scroll_tags(tag_id, tags(*))')
    .eq('id', id)
    .single()

  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })

  // Enforce public visibility for unauthenticated users
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!data.is_public && !session) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(data)
}

// PATCH /api/scrolls/[id] — update scroll metadata (owner only)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description, scroll_type, is_public, repo_url, repo_file_path, repo_branch } = body

  if (!(await resolveOwnership(supabase, id, session.user.id))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('scrolls')
    .update({ title, description, scroll_type, is_public, repo_url, repo_file_path, repo_branch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('scroll_update_error', error, { userId: session.user.id, scrollId: id })
    return Response.json({ error: 'Failed to update scroll' }, { status: 500 })
  }

  logger.info('scroll_updated', { userId: session.user.id, scrollId: id })
  return Response.json(data)
}

// DELETE /api/scrolls/[id] — soft delete (owner only)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await resolveOwnership(supabase, id, session.user.id))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('scrolls')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    logger.error('scroll_delete_error', error, { userId: session.user.id, scrollId: id })
    return Response.json({ error: 'Failed to delete scroll' }, { status: 500 })
  }

  logger.info('scroll_deleted', { userId: session.user.id, scrollId: id })
  return new Response(null, { status: 204 })
}
