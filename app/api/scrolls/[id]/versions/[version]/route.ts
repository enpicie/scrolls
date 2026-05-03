import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// GET /api/scrolls/[id]/versions/[version] — get a specific version's full content
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const { id, version } = await params
  const supabase = await createServerClient()

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
    .select('*, publisher:users!scroll_versions_published_by_fkey(display_name, avatar_url)')
    .eq('scroll_id', id)
    .eq('version', version)
    .single()

  if (error || !data) {
    logger.error('scroll_version_fetch_error', error ?? 'not found', { scrollId: id, version })
    return Response.json({ error: 'Version not found' }, { status: 404 })
  }

  return Response.json(data)
}
