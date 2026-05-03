import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// GET /api/tags — list tags with usage counts
export async function GET() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('tags')
    .select('id, name, usage_count')
    .order('usage_count', { ascending: false })
    .limit(50)

  if (error) {
    logger.error('tags_list_error', error)
    return Response.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }

  return Response.json(data)
}
