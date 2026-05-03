// Route group for auth-required pages.
// Redirect logic lives in proxy.ts — this layout just passes through.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
