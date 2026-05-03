import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// GET /api/teams/[slug] — get team profile with members
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('teams')
    .select('*, members:team_members(user_id, role, users(id, display_name, avatar_url))')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })

  logger.info('team_fetched', { slug })
  return Response.json(data)
}
