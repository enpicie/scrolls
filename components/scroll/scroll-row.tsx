import Link from 'next/link'
import { Heart, Download, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TypeBadge } from '@/components/scroll/type-badge'
import { cn } from '@/lib/utils'
import { type Scroll } from '@/types'

interface ScrollRowProps {
  scroll: Scroll
  ownerSlug: string
  className?: string
}

export function ScrollRow({ scroll, ownerSlug, className }: ScrollRowProps) {
  const href = `/${ownerSlug}/${scroll.slug}`
  const ownerName = scroll.owner_user?.display_name ?? scroll.owner_team?.name ?? 'Unknown'
  const ownerAvatar = scroll.owner_user?.avatar_url ?? scroll.owner_team?.avatar_url ?? null
  const ownerInitial = ownerName[0]?.toUpperCase() ?? '?'

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition hover:bg-accent',
        className
      )}
    >
      {/* Type indicator bar */}
      <div
        className={cn('h-8 w-1 shrink-0 rounded-full', {
          'bg-scroll-general': scroll.scroll_type === 'general',
          'bg-scroll-stack': scroll.scroll_type === 'stack',
          'bg-scroll-app': scroll.scroll_type === 'app',
        })}
      />

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{scroll.title}</span>
          <TypeBadge type={scroll.scroll_type} size="sm" />
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="h-3.5 w-3.5">
            <AvatarImage src={ownerAvatar ?? undefined} />
            <AvatarFallback className="text-[8px]">{ownerInitial}</AvatarFallback>
          </Avatar>
          <span>{ownerName}</span>
          {scroll.ai_summary && (
            <>
              <span>·</span>
              <span className="truncate">{scroll.ai_summary}</span>
            </>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
        <span className="flex items-center gap-1">
          <Download className="h-3 w-3" />
          {scroll.pull_count.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="h-3 w-3" />
          {scroll.favorite_count.toLocaleString()}
        </span>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
