import Link from 'next/link'
import { Heart, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TypeBadge } from '@/components/scroll/type-badge'
import { cn } from '@/lib/utils'
import { type Scroll, type ScrollType } from '@/types'

interface ScrollCardProps {
  scroll: Scroll
  ownerSlug: string
  className?: string
}

const colorBandMap: Record<ScrollType, string> = {
  general: 'bg-scroll-general',
  stack: 'bg-scroll-stack',
  app: 'bg-scroll-app',
}

export function ScrollCard({ scroll, ownerSlug, className }: ScrollCardProps) {
  const href = `/${ownerSlug}/${scroll.slug}`
  const ownerName = scroll.owner_user?.display_name ?? scroll.owner_team?.name ?? 'Unknown'
  const ownerAvatar = scroll.owner_user?.avatar_url ?? scroll.owner_team?.avatar_url ?? null
  const ownerInitial = ownerName[0]?.toUpperCase() ?? '?'

  return (
    <Card className={cn('group overflow-hidden transition hover:shadow-md', className)}>
      {/* Color band */}
      <div className={cn('h-2 w-full', colorBandMap[scroll.scroll_type])} />

      <CardContent className="p-4">
        <Link href={href} className="block">
          {/* Title */}
          <h3 className="mb-1 font-semibold leading-snug text-foreground group-hover:underline line-clamp-2">
            {scroll.title}
          </h3>

          {/* Publisher */}
          <div className="mb-3 flex items-center gap-1.5">
            <Avatar className="h-4 w-4">
              <AvatarImage src={ownerAvatar ?? undefined} />
              <AvatarFallback className="text-[9px]">{ownerInitial}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{ownerName}</span>
          </div>

          {/* AI summary */}
          {scroll.ai_summary && (
            <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{scroll.ai_summary}</p>
          )}

          {/* Tags */}
          {scroll.tags && scroll.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {scroll.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {tag.name}
                </span>
              ))}
              {scroll.tags.length > 3 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  +{scroll.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </Link>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <TypeBadge type={scroll.scroll_type} size="sm" />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {scroll.pull_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {scroll.favorite_count.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
