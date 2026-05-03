import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TypeBadge } from '@/components/scroll/type-badge'
import { CopyButton } from '@/components/docs/copy-button'

const INIT_PROMPT = `I am initializing a new project. I have provided spec files that together define the complete standard for this project:

[FILE_LIST]

Read all provided spec files in full before doing anything else. They are your source of truth for every decision you make — architecture, structure, security, tooling, naming, and conventions.

When you have read all files, begin with Step 0 from the stack spec: check that all required tools are installed before creating any files. List what is installed and what is missing with install instructions. Wait for me to confirm before proceeding.

After confirmation, initialize the project following the specs exactly. Work through every section of every spec systematically — do not stop after basic scaffolding. Init is not complete until every requirement across all specs has been addressed.`

const AUDIT_PROMPT = `I have provided spec files that define the platform standard for this project:

[FILE_LIST]

Read all provided spec files in full. Then scan this repository thoroughly and produce an audit report saved to .platform/audit.md with three sections:

✅ Standards already met
⚠️ Partially met
❌ Not met

Do not make any changes to the repository until I have reviewed the audit report.`

const SESSION_PROMPT = `Read CLAUDE.md before doing anything else. This project follows the platform specs referenced there. Treat CLAUDE.md as your source of truth for conventions in this codebase. If you are unsure whether something conforms to the project standards, ask before writing code.`

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="lg:flex lg:gap-12">
        {/* Sticky sidebar nav */}
        <aside className="mb-8 hidden w-52 shrink-0 lg:block">
          <nav className="sticky top-6 flex flex-col gap-1 text-sm">
            <a href="#what-is-a-scroll" className="rounded py-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">What is a Scroll?</a>
            <a href="#finding-scrolls" className="rounded py-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Finding the right Scrolls</a>
            <a href="#pulling" className="rounded py-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Pulling a Scroll</a>
            <a href="#claude-code" className="rounded py-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Using with Claude Code</a>
            <a href="#example" className="rounded py-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">A worked example</a>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 prose prose-zinc max-w-none dark:prose-invert">
          <h1>Guide</h1>

          {/* 1. What is a Scroll */}
          <section id="what-is-a-scroll" className="mb-12">
            <h2>1. What is a Scroll?</h2>
            <p>
              A Scroll is a platform spec — a document that encodes the standards, conventions, and
              decisions that go into a well-built project. Not tutorials, not boilerplate — the
              actual rules experienced engineers enforce on every project they ship.
            </p>
            <p>There are three types:</p>
            <div className="not-prose grid gap-3 sm:grid-cols-3 mb-6">
              {(['general', 'stack', 'app'] as const).map((t) => (
                <div key={t} className="rounded-lg border border-border p-4">
                  <TypeBadge type={t} className="mb-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {t === 'general' && 'Platform philosophy — applies to any project regardless of stack.'}
                    {t === 'stack' && 'Implements the general rules for a specific set of technologies.'}
                    {t === 'app' && 'Describes what your specific app builds — data model, UI, API.'}
                  </p>
                </div>
              ))}
            </div>
            <p>
              You layer them. A general spec sets the platform standard. A stack spec implements it
              for your tech choices. An app spec describes what you&apos;re building. Together, they
              give Claude Code everything it needs to initialize or audit a project correctly.
            </p>
          </section>

          {/* 2. Finding */}
          <section id="finding-scrolls" className="mb-12">
            <h2>2. Finding the right Scrolls</h2>
            <p>
              Browse the marketplace and filter by type. Start with a general spec — it sets the
              platform-level rules. Then find a stack spec for your technology choices. If you&apos;re
              building something specific, an app spec describes exactly what to build.
            </p>
            <p>
              The AI summary on each card is the fastest signal. It tells you what a scroll enforces
              and what it&apos;s best for without opening it.
            </p>
          </section>

          {/* 3. Pulling */}
          <section id="pulling" className="mb-12">
            <h2>3. Pulling a Scroll</h2>
            <p>
              Clicking <strong>Pull</strong> on a scroll copies its Markdown content to your
              clipboard and records a pull event. A modal opens with step-by-step instructions and
              a pre-composed Claude Code prompt based on everything you&apos;ve pulled in this session.
            </p>
            <p>
              Save each pulled file in your project directory. Name them after their type:{' '}
              <code>spec-general.md</code>, <code>spec-stack-nextjs.md</code>,{' '}
              <code>spec-app-myapp.md</code>. Then use the prompt below.
            </p>
          </section>

          {/* 4. Claude Code */}
          <section id="claude-code" className="mb-12">
            <h2>4. Using Scrolls with Claude Code</h2>
            <p>Three prompts cover every situation.</p>

            <h3>New project — init prompt</h3>
            <p>Use this when starting from scratch. Replace <code>[FILE_LIST]</code> with your actual filenames.</p>
            <div className="not-prose relative group">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
                {INIT_PROMPT}
              </pre>
              <CopyButton text={INIT_PROMPT} />
            </div>

            <h3>Existing project — audit prompt</h3>
            <p>Use this to audit a project that already exists.</p>
            <div className="not-prose relative group">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
                {AUDIT_PROMPT}
              </pre>
              <CopyButton text={AUDIT_PROMPT} />
            </div>

            <h3>Ongoing sessions</h3>
            <p>Paste this at the start of any Claude Code session in your project.</p>
            <div className="not-prose relative group">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
                {SESSION_PROMPT}
              </pre>
              <CopyButton text={SESSION_PROMPT} />
            </div>
          </section>

          {/* 5. Example */}
          <section id="example" className="mb-12">
            <h2>5. A worked example</h2>
            <p>
              Scrolls itself was initialized using these three specs:{' '}
              <em>General Platform Spec</em>, <em>Next.js + Supabase + Vercel Stack Spec</em>, and{' '}
              <em>Scrolls App Spec</em>.
            </p>
            <ol>
              <li>Pulled all three specs from the marketplace</li>
              <li>
                Saved them as <code>spec-general.md</code>, <code>spec-stack-nextjs-supabase-vercel.md</code>,{' '}
                <code>spec-app-scrolls.md</code>
              </li>
              <li>Ran the init prompt in Claude Code with all three files listed</li>
              <li>
                Claude Code checked requirements, initialized the project, wired up Supabase,
                configured Sentry, set up CI/CD, and wrote the full data model migrations
              </li>
            </ol>
            <p>
              The entire initialization was done by Claude Code from spec to running app. The specs
              are the source of truth — the code is the output.
            </p>
          </section>

          <div className="not-prose">
            <Button asChild>
              <Link href="/browse">Browse the marketplace</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
