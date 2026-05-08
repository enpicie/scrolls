'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TypeBadge } from '@/components/scroll/type-badge'
import { GuidedEditor, type GuidedEditorHandle } from '@/components/editor/guided-editor'
import { type ScrollType, type ContentMode } from '@/types'
import { PanelRight } from 'lucide-react'

interface TeamMembership {
  team_id: string
  role: string
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

const SCROLL_TYPES: ScrollType[] = ['general', 'stack']

// ─── Extracted sidebar content ─────────────────────────────────────────────────
// Rendered in both the desktop aside and the mobile Sheet to avoid duplication.

interface SidebarContentProps {
  autoExpand: boolean
  onAutoExpandChange: (v: boolean) => void
  title: string
  onTitleChange: (v: string) => void
  slug: string
  onSlugChange: (v: string) => void
  description: string
  onDescriptionChange: (v: string) => void
  scrollType: ScrollType
  onScrollTypeChange: (v: ScrollType) => void
  isPublic: boolean
  onIsPublicChange: (v: boolean) => void
  teamMemberships: TeamMembership[]
  activeTab: 'guided' | 'raw'
  onSave: () => void
  isSaving: boolean
}

function SidebarContent({
  autoExpand, onAutoExpandChange,
  title, onTitleChange,
  slug, onSlugChange,
  description, onDescriptionChange,
  scrollType, onScrollTypeChange,
  isPublic, onIsPublicChange,
  teamMemberships,
  activeTab, onSave, isSaving,
}: SidebarContentProps) {
  return (
    <div className="space-y-6 p-4">
      {/* Options */}
      <div>
        <h2 className="mb-2 text-sm font-semibold">Options</h2>
        <div className="space-y-2">
          <label htmlFor="auto-expand" className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              id="auto-expand"
              checked={autoExpand}
              onChange={(e) => onAutoExpandChange(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border accent-primary"
            />
            Auto-expand
            <span className="text-xs text-muted-foreground">— boxes grow to fit</span>
          </label>
        </div>
      </div>

      {/* Metadata */}
      <div>
        <h2 className="mb-4 text-sm font-semibold">Metadata</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="My Platform Spec"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="my-platform-spec"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
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
                  onClick={() => onScrollTypeChange(t)}
                  className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
                    scrollType === t ? 'bg-accent font-medium' : 'hover:bg-accent/50'
                  }`}
                >
                  <TypeBadge type={t} size="sm" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={isPublic}
              onChange={(e) => onIsPublicChange(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="is_public" className="cursor-pointer font-normal">
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
      </div>

      <div className="border-t border-border p-4">
        <Button className="w-full" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : activeTab === 'guided' ? 'Review & Save Draft' : 'Save Draft'}
        </Button>
      </div>
    </div>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function ScrollEditorShell({ mode, scroll, teamMemberships }: ScrollEditorShellProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'guided' | 'raw'>('guided')
  const [title, setTitle] = useState(scroll?.title ?? '')
  const [slug, setSlug] = useState(scroll?.slug ?? '')
  const [description, setDescription] = useState(scroll?.description ?? '')
  const [scrollType, setScrollType] = useState<ScrollType>(scroll?.scroll_type ?? 'general')
  const [isPublic, setIsPublic] = useState(scroll?.is_public ?? false)
  const [rawContent, setRawContent] = useState('')
  const [autoExpand, setAutoExpand] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [syncConfirmPending, setSyncConfirmPending] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const guidedEditorRef = useRef<GuidedEditorHandle>(null)
  const latestGuidedContent = useRef('')
  const handleGuidedContentUpdate = useCallback((content: string) => {
    latestGuidedContent.current = content
  }, [])

  const handleSlugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (mode === 'new') setSlug(handleSlugify(value))
  }

  const createScroll = async () => {
    if (!title || !slug || !description) {
      throw new Error('Title, slug, and description are required — fill them in using the sidebar')
    }
    const method = mode === 'new' ? 'POST' : 'PATCH'
    const url = mode === 'new' ? '/api/scrolls' : `/api/scrolls/${scroll!.id}`
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, slug, description, scroll_type: scrollType, is_public: isPublic, content_mode: 'inline' }),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Save failed')
    }
    return res.json() as Promise<{ id: string }>
  }

  const handleRawSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const created = await createScroll()
      if (mode === 'new') router.push(`/scrolls/${created.id}/edit`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGuidedSave = async (content: string) => {
    setIsSaving(true)
    setError(null)
    try {
      const created = await createScroll()
      const versionRes = await fetch(`/api/scrolls/${created.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: '1.0.0', content, set_active: true }),
      })
      if (!versionRes.ok) {
        const body = await versionRes.json()
        throw new Error(body.error ?? 'Failed to save content')
      }
      router.push(`/scrolls/${created.id}/edit`)
    } catch (err) {
      setIsSaving(false)
      throw err
    }
    setIsSaving(false)
  }

  const sidebarProps: SidebarContentProps = {
    autoExpand, onAutoExpandChange: setAutoExpand,
    title, onTitleChange: handleTitleChange,
    slug, onSlugChange: (v) => setSlug(handleSlugify(v)),
    description, onDescriptionChange: setDescription,
    scrollType, onScrollTypeChange: setScrollType,
    isPublic, onIsPublicChange: setIsPublic,
    teamMemberships,
    activeTab,
    onSave: () => activeTab === 'guided' ? guidedEditorRef.current?.openReview() : handleRawSave(),
    isSaving,
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Editor header */}
      <div className="border-b border-border bg-background px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <TypeBadge type={scrollType} />
            <span className="truncate text-sm text-muted-foreground">
              {mode === 'new' ? 'New scroll' : `Editing: ${scroll?.title}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'raw' && (
              <Button variant="outline" size="sm" onClick={handleRawSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save draft'}
              </Button>
            )}
            <Button size="sm" disabled>Publish</Button>
            {/* Sidebar access on screens where the aside is hidden */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
              aria-label="Open options and metadata"
            >
              <PanelRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content area */}
        <div className="flex flex-1 flex-col overflow-auto p-4 sm:p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Tabs
              defaultValue="guided"
              onValueChange={(v) => {
                const tab = v as 'guided' | 'raw'
                setActiveTab(tab)
                setSyncConfirmPending(false)
                if (tab === 'raw' && rawContent === '') {
                  setRawContent(latestGuidedContent.current)
                }
              }}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="guided">Guided</TabsTrigger>
                <TabsTrigger value="raw">Raw</TabsTrigger>
              </TabsList>

              {/* forceMount keeps guided state alive while on the raw tab */}
              <TabsContent forceMount value="guided" className="data-[state=inactive]:hidden">
                <GuidedEditor
                  ref={guidedEditorRef}
                  key={scrollType}
                  scrollType={scrollType}
                  autoExpand={autoExpand}
                  onContentUpdate={handleGuidedContentUpdate}
                  onSave={handleGuidedSave}
                  isSaving={isSaving}
                />
              </TabsContent>

              <TabsContent forceMount value="raw" className="data-[state=inactive]:hidden">
                <div className="space-y-3">
                  {/* Info bar + sync action */}
                  <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    {syncConfirmPending ? (
                      <div className="flex items-center justify-between">
                        <span className="text-warning">This will overwrite your raw edits.</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSyncConfirmPending(false)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRawContent(latestGuidedContent.current)
                              setSyncConfirmPending(false)
                            }}
                            className="font-medium text-foreground"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span>Edits here are independent from your guided sections.</span>
                        <button
                          type="button"
                          onClick={() => setSyncConfirmPending(true)}
                          className="shrink-0 font-medium text-foreground underline-offset-2 transition-colors hover:underline"
                        >
                          Replace with guided
                        </button>
                      </div>
                    )}
                  </div>
                  <Textarea
                    className="min-h-[500px] font-mono text-sm"
                    placeholder="Write your spec in Markdown…"
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleRawSave} disabled={isSaving}>
                      {isSaving ? 'Saving…' : 'Save Draft'}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
        </div>

        {/* Metadata sidebar — desktop only */}
        <aside className="hidden w-72 shrink-0 overflow-auto border-l border-border bg-muted/30 lg:block">
          {/* Options sticky at top of sidebar scroll area */}
          <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
            <h2 className="mb-2 text-sm font-semibold">Options</h2>
            <div className="space-y-2">
              <label htmlFor="auto-expand-d" className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  id="auto-expand-d"
                  checked={autoExpand}
                  onChange={(e) => setAutoExpand(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border accent-primary"
                />
                Auto-expand
                <span className="text-xs text-muted-foreground">— boxes grow to fit</span>
              </label>
            </div>
          </div>
          <div className="p-4">
            <h2 className="mb-4 text-sm font-semibold">Metadata</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title-d">Title</Label>
                <Input id="title-d" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="My Platform Spec" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug-d">Slug</Label>
                <Input id="slug-d" value={slug} onChange={(e) => setSlug(handleSlugify(e.target.value))} placeholder="my-platform-spec" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description-d">Description</Label>
                <Textarea id="description-d" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short summary shown on cards and in search" rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <div className="flex flex-col gap-1">
                  {SCROLL_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setScrollType(t)}
                      className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${scrollType === t ? 'bg-accent font-medium' : 'hover:bg-accent/50'}`}
                    >
                      <TypeBadge type={t} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_public-d" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 rounded border-border" />
                <Label htmlFor="is_public-d" className="cursor-pointer font-normal">Public — visible in marketplace</Label>
              </div>
              {teamMemberships.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Owner</Label>
                  <p className="text-xs text-muted-foreground">Team ownership coming soon</p>
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-border p-4">
            <Button
              className="w-full"
              onClick={() => activeTab === 'guided' ? guidedEditorRef.current?.openReview() : handleRawSave()}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : activeTab === 'guided' ? 'Review & Save Draft' : 'Save Draft'}
            </Button>
          </div>
        </aside>
      </div>

      {/* Mobile sidebar sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="right" className="w-80 overflow-auto p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle className="text-sm">Options & Metadata</SheetTitle>
          </SheetHeader>
          <SidebarContent {...sidebarProps} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
