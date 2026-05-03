'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TypeBadge } from '@/components/scroll/type-badge'
import { type ScrollType, type ContentMode, SCROLL_TYPE_LABELS } from '@/types'

interface TeamMembership {
  team_id: string
  role: string
  // Supabase returns joined tables as array or object depending on relationship cardinality
  teams: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null
}

interface ScrollEditorShellProps {
  mode: 'new' | 'edit'
  scroll?: {
    id: string
    title: string
    slug: string
    description: string
    scroll_type: ScrollType
    content_mode: ContentMode
    is_public: boolean
    user_id: string | null
    team_id: string | null
  }
  teamMemberships: TeamMembership[]
}

const SCROLL_TYPES: ScrollType[] = ['general', 'stack', 'app']

export function ScrollEditorShell({ mode, scroll, teamMemberships }: ScrollEditorShellProps) {
  const router = useRouter()
  const [title, setTitle] = useState(scroll?.title ?? '')
  const [slug, setSlug] = useState(scroll?.slug ?? '')
  const [description, setDescription] = useState(scroll?.description ?? '')
  const [scrollType, setScrollType] = useState<ScrollType>(scroll?.scroll_type ?? 'general')
  const [isPublic, setIsPublic] = useState(scroll?.is_public ?? false)
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSlugify = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (mode === 'new') setSlug(handleSlugify(value))
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const method = mode === 'new' ? 'POST' : 'PATCH'
      const url = mode === 'new' ? '/api/scrolls' : `/api/scrolls/${scroll!.id}`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, description, scroll_type: scrollType, is_public: isPublic, content_mode: 'inline' }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Save failed')
        return
      }
      if (mode === 'new') {
        const created = await res.json()
        router.push(`/scrolls/${created.id}/edit`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Editor header */}
      <div className="border-b border-border bg-background px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <TypeBadge type={scrollType} />
            <span className="truncate text-sm text-muted-foreground">
              {mode === 'new' ? 'New scroll' : `Editing: ${scroll?.title}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save draft'}
            </Button>
            <Button size="sm" disabled>
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content area */}
        <div className="flex flex-1 flex-col overflow-auto p-4 sm:p-6">
          <div className="mx-auto w-full max-w-4xl">
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Tabs defaultValue="raw">
              <TabsList className="mb-4">
                <TabsTrigger value="guided">Guided</TabsTrigger>
                <TabsTrigger value="raw">Raw</TabsTrigger>
              </TabsList>

              <TabsContent value="guided">
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                  Guided mode — structured section form — coming soon
                </div>
              </TabsContent>

              <TabsContent value="raw">
                <Textarea
                  className="min-h-[500px] font-mono text-sm"
                  placeholder="Write your spec in Markdown…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Metadata sidebar */}
        <aside className="hidden w-72 shrink-0 overflow-auto border-l border-border bg-muted/30 p-4 lg:block">
          <h2 className="mb-4 text-sm font-semibold">Metadata</h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="My Platform Spec"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(handleSlugify(e.target.value))}
                placeholder="my-platform-spec"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary shown on cards and in search"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="flex flex-col gap-1">
                {SCROLL_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setScrollType(t)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      scrollType === t ? 'bg-accent font-medium' : 'hover:bg-accent/50'
                    }`}
                  >
                    <TypeBadge type={t} size="sm" />
                    <span>{SCROLL_TYPE_LABELS[t]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="is_public" className="font-normal cursor-pointer">
                Public — visible in marketplace
              </Label>
            </div>

            {teamMemberships.length > 0 && (
              <div className="space-y-1.5">
                <Label>Owner</Label>
                <p className="text-xs text-muted-foreground">Team ownership coming soon</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
