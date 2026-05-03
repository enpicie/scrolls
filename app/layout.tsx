import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Nav } from '@/components/layout/nav'
import { Footer } from '@/components/layout/footer'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Scrolls — The marketplace for platform specs',
  description:
    'Discover, compose, and use platform specs to start or audit projects with professional-grade foundations.',
}

// Runs before React hydrates — reads localStorage and sets .dark on <html>
// so the correct theme is applied on the very first paint (no FOUC).
// Must be delivered via next/script with strategy="beforeInteractive" so that
// Next.js extracts it from the React component tree before hydration.
// Never use <script dangerouslySetInnerHTML> directly in JSX — React 19 warns
// "Scripts inside React components are never executed when rendering on the client."
const FOUC_SCRIPT = `(function(){try{
  var t=localStorage.getItem('scrolls-theme');
  if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){
    document.documentElement.classList.add('dark');
  }
}catch(e){}})();`

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* beforeInteractive — Next.js hoists this to <head> and executes it
            before any page JS, outside of React's rendering pipeline. */}
        <Script
          id="theme-fouc"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }}
        />
        <Nav />
        <main className="flex flex-1 flex-col">
          {children}
        </main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
