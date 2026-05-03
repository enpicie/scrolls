import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ScrollEditorShell } from '@/components/editor/scroll-editor-shell'

interface EditScrollPageProps {
  params: Promise<{ id: string }>
}

export default async function EditScrollPage({ params }: EditScrollPageProps) {
  const { id } = await params
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: scroll } = await supabase
    .from('scrolls')
    .select('*, scroll_versions(*)')
    .eq('id', id)
    .single()

  if (!scroll) notFound()

  // Verify ownership — user must own the scroll or be a team member
  const isOwner = scroll.user_id === user.id
  let isTeamMember = false
  if (scroll.team_id) {
    const { data } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', scroll.team_id)
      .eq('user_id', user.id)
      .single()
    isTeamMember = !!data
  }

  if (!isOwner && !isTeamMember) redirect('/')

  const { data: teamMemberships } = await supabase
    .from('team_members')
    .select('team_id, role, teams(id, name, slug)')
    .eq('user_id', user.id)

  return (
    <ScrollEditorShell
      mode="edit"
      scroll={scroll}
      teamMemberships={teamMemberships ?? []}
    />
  )
}
