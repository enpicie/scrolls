import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { TypeBadge } from '@/components/scroll/type-badge'
import { HeroSignIn } from '@/components/auth/hero-sign-in'
import { ArrowRight, BookOpen, Layers, Sparkles } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center gap-2">
              <TypeBadge type="general" />
              <TypeBadge type="stack" />
              <TypeBadge type="app" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              The marketplace for platform specs
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Experienced engineers publish the standards they actually use. Developers at any level
              discover, compose, and apply them — to start new projects right or audit existing ones.
            </p>

            {user ? (
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    Go to dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/browse">Browse specs</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <HeroSignIn />
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/browse">
                    Browse without signing in
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Three spec levels */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="mb-2 text-2xl font-bold">Three levels of spec</h2>
            <p className="text-muted-foreground">Layer them together for a complete project foundation.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-scroll-general/10">
                  <BookOpen className="h-5 w-5 text-scroll-general" />
                </div>
                <TypeBadge type="general" />
              </div>
              <h3 className="mb-1 font-semibold">General Standard</h3>
              <p className="text-sm text-muted-foreground">
                Stack-agnostic platform philosophy — local dev, CI/CD shape, security baseline,
                observability, and documentation standards. Applies to any project.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-scroll-stack/10">
                  <Layers className="h-5 w-5 text-scroll-stack" />
                </div>
                <TypeBadge type="stack" />
              </div>
              <h3 className="mb-1 font-semibold">Stack Standard</h3>
              <p className="text-sm text-muted-foreground">
                Implements the general rules for a specific technology set — Next.js + Supabase,
                Rails + Postgres, FastAPI + Postgres, and more.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-scroll-app/10">
                  <Sparkles className="h-5 w-5 text-scroll-app" />
                </div>
                <TypeBadge type="app" />
              </div>
              <h3 className="mb-1 font-semibold">App Design</h3>
              <p className="text-sm text-muted-foreground">
                Describes what a specific app builds — data model, API surface, UI screens, and
                business rules. Makes Claude Code an expert on your app before you write a line.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to use */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-2xl font-bold">Pull a spec, initialize with Claude Code</h2>
            <p className="mb-8 text-muted-foreground">
              Find the specs you need, pull them to your machine, then give them to Claude Code with
              the init prompt. Your project gets a professional-grade foundation in minutes.
            </p>
            <Button variant="outline" asChild>
              <Link href="/docs">
                Read the guide
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
