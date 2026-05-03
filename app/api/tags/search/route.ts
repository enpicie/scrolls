import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// GET /api/tags/search?q= — search tags by name (autocomplete)
export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q) return Response.json([])

  const { data, error } = await supabase
    .from('tags')
    .select('id, name, usage_count')
    .ilike('name', `${q}%`)
    .order('usage_count', { ascending: false })
    .limit(10)

  if (error) {
    logger.error('tags_search_error', error, { query: q })
    return Response.json({ error: 'Failed to search tags' }, { status: 500 })
  }

  return Response.json(data)
}
