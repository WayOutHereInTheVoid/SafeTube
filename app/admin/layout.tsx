import { createClient } from '@/lib/supabase/server'
import AdminShell from './components/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let childName: string | null = null
  if (user) {
    const { data } = await supabase
      .from('child_profile')
      .select('name')
      .eq('parent_id', user.id)
      .maybeSingle()
    childName = data?.name ?? null
  }

  return <AdminShell childName={childName}>{children}</AdminShell>
}
