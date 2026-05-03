import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutMenuItem } from '@/components/auth/sign-out-button'
import { ScrollText, Plus } from 'lucide-react'

export async function Nav() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch the user's display profile from public.users if authenticated
  let profile: { display_name: string; avatar_url: string | null } | null = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const initials = profile?.display_name
    ? profile.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <header className="border-b border-border bg-background">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <ScrollText className="h-5 w-5 text-scroll-general" />
          Scrolls
        </Link>

        {/* Primary nav */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/browse">Browse</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/docs">Docs</Link>
          </Button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side */}
        {user && profile ? (
          <div className="flex items-center gap-2">
            <Button size="sm" asChild>
              <Link href="/scrolls/new">
                <Plus className="mr-1.5 h-4 w-4" />
                New scroll
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full ring-2 ring-transparent transition hover:ring-border focus-visible:outline-none focus-visible:ring-ring">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-medium">{profile.display_name}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <SignOutMenuItem />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/?signin=1">Sign in</Link>
            </Button>
          </div>
        )}
      </nav>
    </header>
  )
}
