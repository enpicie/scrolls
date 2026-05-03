import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, ScrollText, Heart, Users } from 'lucide-react'

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
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-8 py-16 text-center">
            <ScrollText className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="font-medium">No scrolls yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Publish your first platform spec to the marketplace.</p>
            <Button className="mt-6" asChild>
              <Link href="/scrolls/new">Create your first scroll</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-8 py-16 text-center">
            <Heart className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="font-medium">No favorites yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Save scrolls you want to revisit or use in your projects.</p>
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/browse">Browse the marketplace</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-8 py-16 text-center">
            <Users className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="font-medium">No teams yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Teams let you publish scrolls under a shared org identity.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
