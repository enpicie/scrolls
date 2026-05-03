import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// GET /api/favorites — get current user's favorites
export async function GET() {
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_favorites')
    .select('*, scroll:scrolls(*, owner_user:users!scrolls_user_id_fkey(id, display_name, avatar_url), owner_team:teams!scrolls_team_id_fkey(id, name, slug, avatar_url))')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('favorites_list_error', error, { userId: session.user.id })
    return Response.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }

  return Response.json(data)
}

// POST /api/favorites — add a favorite
export async function POST(request: Request) {
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { scroll_id } = body

  if (!scroll_id) return Response.json({ error: 'Missing scroll_id' }, { status: 400 })

  const { error } = await supabase.from('user_favorites').insert({
    user_id: session.user.id,
    scroll_id,
  })

  if (error) {
    logger.error('favorite_add_error', error, { userId: session.user.id, scrollId: scroll_id })
    if (error.code === '23505') return Response.json({ error: 'Already favorited' }, { status: 409 })
    return Response.json({ error: 'Failed to add favorite' }, { status: 500 })
  }

  logger.info('favorite_added', { userId: session.user.id, scrollId: scroll_id })
  return Response.json({ ok: true }, { status: 201 })
}
