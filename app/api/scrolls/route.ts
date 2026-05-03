import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// GET /api/scrolls — list public published scrolls (paginated marketplace feed)
export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const perPage = Math.min(parseInt(searchParams.get('per_page') ?? '24', 10), 48)
  const scrollType = searchParams.get('type')
  const sort = searchParams.get('sort') ?? 'pulls'
  const q = searchParams.get('q')
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('scrolls')
    .select('*, owner_user:users!scrolls_user_id_fkey(id, display_name, avatar_url), owner_team:teams!scrolls_team_id_fkey(id, name, slug, avatar_url)', {
      count: 'exact',
    })
    .eq('is_public', true)
    .eq('is_published', true)
    .is('deleted_at', null)
    .range(from, to)

  if (scrollType) query = query.eq('scroll_type', scrollType)
  if (q) query = query.ilike('title', `%${q}%`)

  if (sort === 'pulls') query = query.order('pull_count', { ascending: false })
  else if (sort === 'favorites') query = query.order('favorite_count', { ascending: false })
  else query = query.order('updated_at', { ascending: false })

  const { data, error, count } = await query
  if (error) {
    logger.error('scrolls_list_error', error)
    return Response.json({ error: 'Failed to fetch scrolls' }, { status: 500 })
  }

  return Response.json({
    data,
    total: count ?? 0,
    page,
    per_page: perPage,
    has_more: (count ?? 0) > page * perPage,
  })
}

// POST /api/scrolls — create a new scroll (authenticated)
export async function POST(request: Request) {
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, slug, description, scroll_type, content_mode, is_public, team_id } = body

  if (!title || !slug || !description || !scroll_type) {
    return Response.json({ error: 'Missing required fields: title, slug, description, scroll_type' }, { status: 400 })
  }

  const owner_type = team_id ? 'team' : 'user'

  // If team_id provided, confirm user is a team member
  if (team_id) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team_id)
      .eq('user_id', session.user.id)
      .single()
    if (!membership) return Response.json({ error: 'Not a member of this team' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('scrolls')
    .insert({
      owner_type,
      user_id: owner_type === 'user' ? session.user.id : null,
      team_id: owner_type === 'team' ? team_id : null,
      created_by: session.user.id,
      title,
      slug,
      description,
      scroll_type,
      content_mode: content_mode ?? 'inline',
      is_public: is_public ?? false,
    })
    .select()
    .single()

  if (error) {
    logger.error('scroll_create_error', error, { userId: session.user.id })
    if (error.code === '23505') return Response.json({ error: 'A scroll with this slug already exists' }, { status: 409 })
    return Response.json({ error: 'Failed to create scroll' }, { status: 500 })
  }

  logger.info('scroll_created', { userId: session.user.id, scrollId: data.id })
  return Response.json(data, { status: 201 })
}
