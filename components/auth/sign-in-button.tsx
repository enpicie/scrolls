'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface SignInButtonProps {
  provider: 'github' | 'google'
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function SignInButton({
  provider,
  variant = 'outline',
  size = 'default',
  className,
}: SignInButtonProps) {
  const supabase = createClient()

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    })
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleSignIn}>
      Sign in with {provider === 'github' ? 'GitHub' : 'Google'}
    </Button>
  )
}
