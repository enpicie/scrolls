import { cn } from '@/lib/utils'
import { type ScrollType, SCROLL_TYPE_LABELS } from '@/types'

interface TypeBadgeProps {
  type: ScrollType
  className?: string
  size?: 'sm' | 'md'
}

const colorMap: Record<ScrollType, string> = {
  general: 'bg-scroll-general text-scroll-general-foreground',
  stack: 'bg-scroll-stack text-scroll-stack-foreground',
  app: 'bg-scroll-app text-scroll-app-foreground',
}

export function TypeBadge({ type, className, size = 'md' }: TypeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        colorMap[type],
        className
      )}
    >
      {SCROLL_TYPE_LABELS[type]}
    </span>
  )
}
