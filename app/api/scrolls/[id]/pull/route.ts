import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// POST /api/scrolls/[id]/pull — record a pull event, increment pull_count
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  // Pull is allowed for unauthenticated users (null pulled_by)

  const body = await request.json().catch(() => ({}))
  const { version_id } = body as { version_id?: string }

  const { error } = await supabase.from('scroll_pulls').insert({
    scroll_id: id,
    version_id: version_id ?? null,
    pulled_by: session?.user.id ?? null,
  })

  if (error) {
    logger.error('scroll_pull_error', error, { scrollId: id })
    return Response.json({ error: 'Failed to record pull' }, { status: 500 })
  }

  logger.info('scroll_pulled', { scrollId: id, userId: session?.user.id ?? 'anonymous' })
  return Response.json({ ok: true })
}
