import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// DELETE /api/favorites/[scroll_id] — remove a favorite
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ scroll_id: string }> }
) {
  const { scroll_id } = await params
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', session.user.id)
    .eq('scroll_id', scroll_id)

  if (error) {
    logger.error('favorite_remove_error', error, { userId: session.user.id, scrollId: scroll_id })
    return Response.json({ error: 'Failed to remove favorite' }, { status: 500 })
  }

  logger.info('favorite_removed', { userId: session.user.id, scrollId: scroll_id })
  return new Response(null, { status: 204 })
}
