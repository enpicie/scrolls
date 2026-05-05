import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// POST /api/ai/nudge — check if a guided section is too vague for an AI coding assistant
export async function POST(request: Request) {
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { section_title, content } = body

  if (!section_title || !content) {
    return Response.json({ error: 'Missing section_title or content' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json({ suggestion: null })
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
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `You are reviewing one section of a CLAUDE.md document that guides an AI coding assistant. Spot content too vague to be actionable.

Section: "${section_title}"
Content:
${content}

Return JSON with a single field "suggestion": a one-sentence improvement hint if the content is too generic or vague, or null if it is already specific enough.

Rules:
- Flag genuinely vague phrases ("follow best practices", "write clean code", "use good patterns")
- Do NOT flag short or terse content — specific terse rules are fine
- Do NOT flag technical specifics even if unfamiliar
- Return null when the section is already actionable

Return only valid JSON: {"suggestion": "..."} or {"suggestion": null}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      logger.warn('ai_nudge_api_error', { status: response.status })
      return Response.json({ suggestion: null })
    }

    const result = (await response.json()) as { content: Array<{ text: string }> }
    const text = result.content?.[0]?.text ?? '{}'
    const parsed = JSON.parse(text)

    logger.info('ai_nudge_checked', { userId: session.user.id, section: section_title })
    return Response.json({ suggestion: parsed.suggestion ?? null })
  } catch (err) {
    logger.error('ai_nudge_error', err)
    return Response.json({ suggestion: null })
  }
}
