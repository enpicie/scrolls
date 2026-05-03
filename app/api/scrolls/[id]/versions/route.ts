import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// GET /api/scrolls/[id]/versions — list all versions for a scroll
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  // Confirm scroll is accessible
  const { data: scroll } = await supabase
    .from('scrolls')
    .select('id, is_public')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!scroll) return Response.json({ error: 'Not found' }, { status: 404 })

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!scroll.is_public && !session) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('scroll_versions')
    .select('id, version, changelog, published_by, created_at, publisher:users!scroll_versions_published_by_fkey(display_name, avatar_url)')
    .eq('scroll_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('scroll_versions_list_error', error, { scrollId: id })
    return Response.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }

  return Response.json(data)
}
