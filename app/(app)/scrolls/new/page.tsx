import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ScrollEditorShell } from '@/components/editor/scroll-editor-shell'

export default async function NewScrollPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Fetch teams the user belongs to for the owner selector
  const { data: teamMemberships } = await supabase
    .from('team_members')
    .select('team_id, role, teams(id, name, slug)')
    .eq('user_id', user.id)

  return <ScrollEditorShell mode="new" teamMemberships={teamMemberships ?? []} />
}
