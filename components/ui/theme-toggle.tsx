'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Subscribe to .dark class changes on <html> via MutationObserver.
// This is the correct React 18+ pattern for subscribing to external DOM state.
function subscribe(callback: () => void): () => void {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

function getSnapshot(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

// Server (and initial hydration) snapshot — must match what the FOUC script
// produces for the *default* state so there is no structural mismatch.
// The FOUC script in layout.tsx has already set .dark on <html> before React
// hydrates, so suppressHydrationWarning on the dynamic attributes is enough
// to handle the difference in initial props.
function getServerSnapshot(): 'dark' | 'light' {
  return 'light'
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const isDark = theme === 'dark'

  const toggle = useCallback(() => {
    const next = !isDark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('scrolls-theme', next ? 'dark' : 'light')
    } catch {
      // localStorage unavailable in some sandboxed contexts
    }
  }, [isDark])

  return (
    <button
      onClick={toggle}
      // aria-label differs between server snapshot ('light') and actual client
      // state — suppressHydrationWarning tells React to accept the mismatch.
      suppressHydrationWarning
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
        'border border-border bg-muted px-0.5',
        'hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      {/* Sliding pill — suppressHydrationWarning for the translate class */}
      <span
        suppressHydrationWarning
        className={cn(
          'relative flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-sm',
          'transition-transform duration-300 ease-in-out',
          isDark ? 'translate-x-5' : 'translate-x-0'
        )}
      >
        <Sun
          suppressHydrationWarning
          className={cn(
            'absolute h-3 w-3 text-foreground transition-opacity duration-200',
            isDark ? 'opacity-0' : 'opacity-100'
          )}
        />
        <Moon
          suppressHydrationWarning
          className={cn(
            'absolute h-3 w-3 text-foreground transition-opacity duration-200',
            isDark ? 'opacity-100' : 'opacity-0'
          )}
        />
      </span>
    </button>
  )
}
