'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, AlertCircle, CheckCircle2, CircleDashed, X } from 'lucide-react'

export type NudgeState =
  | { status: 'idle' }
  | { status: 'unfilled' }
  | { status: 'loading' }
  | { status: 'suggestion'; text: string }
  | { status: 'clean' }

interface GuidedSectionProps {
  id: string
  title: string
  description: string
  included: boolean
  onToggle: () => void
  content: string
  onChange: (value: string) => void
  nudge: NudgeState
  autoExpand: boolean
  // Custom section props — omit for standard sections
  isCustom?: boolean
  onTitleChange?: (value: string) => void
  onDescriptionChange?: (value: string) => void
  onRemove?: () => void
}

export function GuidedSection({
  id,
  title,
  description,
  included,
  onToggle,
  content,
  onChange,
  nudge,
  autoExpand,
  isCustom,
  onTitleChange,
  onDescriptionChange,
  onRemove,
}: GuidedSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    if (autoExpand) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    } else {
      el.style.height = ''
    }
  }, [content, autoExpand])

  const collapsedTitle = title || (isCustom ? 'Untitled section' : '')

  return (
    <div
      className={cn(
        'rounded-lg border border-border transition-colors',
        included ? 'bg-card' : 'bg-muted/30'
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        {/* Title + description */}
        <div className="min-w-0 flex-1">
          {isCustom && included ? (
            <div className="space-y-1">
              <input
                value={title}
                onChange={(e) => onTitleChange?.(e.target.value)}
                placeholder="Section title"
                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground/50 focus:placeholder:text-muted-foreground/30"
              />
              <input
                value={description}
                onChange={(e) => onDescriptionChange?.(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/40"
              />
            </div>
          ) : (
            <>
              <h3 className={cn('text-sm font-semibold', !included && 'text-muted-foreground')}>
                {collapsedTitle}
              </h3>
              {included && description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-muted-foreground/40 transition-colors hover:text-destructive"
              aria-label="Remove section"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <label
            htmlFor={`include-${id}`}
            className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-muted-foreground"
          >
            <input
              type="checkbox"
              id={`include-${id}`}
              checked={included}
              onChange={onToggle}
              className="h-3.5 w-3.5 rounded border-border accent-primary"
            />
            {included ? 'Included' : 'Excluded'}
          </label>
        </div>
      </div>

      {included && (
        <div className="px-4 pb-4">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isCustom ? 'Section content…' : undefined}
            className={cn(
              'min-h-36 resize-none font-mono text-sm',
              autoExpand && 'overflow-hidden'
            )}
          />
          <NudgeIndicator nudge={nudge} isCustom={!!isCustom} />
        </div>
      )}
    </div>
  )
}

function NudgeIndicator({ nudge, isCustom }: { nudge: NudgeState; isCustom: boolean }) {
  if (nudge.status === 'idle') {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <CircleDashed className="h-3.5 w-3.5 shrink-0" />
        {isCustom
          ? 'Add content to this section'
          : "Replace this example with your project's actual decisions"}
      </p>
    )
  }

  if (nudge.status === 'unfilled') {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        Some blanks are still unfilled
      </p>
    )
  }

  if (nudge.status === 'loading') {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        Checking…
      </p>
    )
  }

  if (nudge.status === 'suggestion') {
    return (
      <p className="mt-2 flex items-start gap-1.5 text-xs text-warning">
        <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
        {nudge.text}
      </p>
    )
  }

  if (nudge.status === 'clean') {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        Specific enough
      </p>
    )
  }

  return null
}
