'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function HeroSignIn() {
  const supabase = createClient()

  const signIn = (provider: 'github' | 'google') => {
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/callback` },
    })
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <Button size="lg" onClick={() => signIn('github')}>
        Sign in with GitHub
      </Button>
      <Button size="lg" variant="outline" onClick={() => signIn('google')}>
        Sign in with Google
      </Button>
    </div>
  )
}
