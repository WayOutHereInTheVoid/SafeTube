import { createClient } from '@/lib/supabase/server'
import AdminShell from './components/AdminShell'

/**
 * Root layout for the admin section of the application.
 * It fetches the current user and their child's profile name to provide context to the AdminShell.
 *
 * @param props - Component properties.
 * @param props.children - The content to be rendered within the admin shell.
 * @returns An AdminShell component wrapping the page content.
 */
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
