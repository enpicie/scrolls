import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// POST /api/ai/summarize — generate AI summary for a scroll version (internal, called on publish)
export async function POST(request: Request) {
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { scroll_id, version_id, content } = body

  if (!scroll_id || !version_id || !content) {
    return Response.json({ error: 'Missing required fields: scroll_id, version_id, content' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    logger.warn('ai_summarize_no_api_key', { scrollId: scroll_id, versionId: version_id })
    return Response.json({ error: 'AI summarization not configured' }, { status: 503 })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `You are summarizing a platform specification document for a developer marketplace. Given the full Markdown content of a spec, return a JSON object with these fields:
- "one_liner": one sentence describing what this spec is and who it is for
- "what_it_enforces": array of 3-5 short strings (the key standards it applies)
- "best_for": array of 2-4 short strings (inferred use cases)
- "stack_signals": array of technology names referenced in the content

Return only valid JSON, no markdown, no explanation.

Spec content:
${content.slice(0, 8000)}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      logger.error('ai_summarize_api_error', { status: response.status }, { scrollId: scroll_id })
      return Response.json({ error: 'AI service error' }, { status: 502 })
    }

    const result = (await response.json()) as { content: Array<{ text: string }> }
    const text = result.content?.[0]?.text ?? '{}'
    const summary = JSON.parse(text)

    // Persist to scroll_versions and scrolls
    await Promise.all([
      supabase
        .from('scroll_versions')
        .update({ ai_summary: summary })
        .eq('id', version_id),
      supabase
        .from('scrolls')
        .update({ ai_summary: summary.one_liner, ai_summary_tags: summary.stack_signals ?? [] })
        .eq('id', scroll_id),
    ])

    logger.info('ai_summary_generated', { scrollId: scroll_id, versionId: version_id })
    return Response.json(summary)
  } catch (err) {
    logger.error('ai_summarize_error', err, { scrollId: scroll_id, versionId: version_id })
    return Response.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
