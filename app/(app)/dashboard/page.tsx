import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {profile && (
            <p className="text-muted-foreground">Welcome back, {profile.display_name}</p>
          )}
        </div>
        <Button asChild>
          <Link href="/scrolls/new">
            <Plus className="mr-2 h-4 w-4" />
            New scroll
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="my-scrolls">
        <TabsList>
          <TabsTrigger value="my-scrolls">My Scrolls</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="my-scrolls" className="mt-6">
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No scrolls yet.</p>
            <Button className="mt-4" asChild>
              <Link href="/scrolls/new">Create your first scroll</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No favorites yet.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/browse">Browse the marketplace</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">You are not a member of any teams.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
