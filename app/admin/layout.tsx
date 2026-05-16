import { createClient, getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminShell from './components/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const { data } = await createClient()
    .from('child_profile')
    .select('name')
    .eq('parent_id', user.id)
    .maybeSingle()

  return <AdminShell childName={data?.name ?? null}>{children}</AdminShell>
}
