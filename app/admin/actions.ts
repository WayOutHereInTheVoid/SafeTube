'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Logs out the current parent user by signing out of Supabase and redirecting to the login page.
 */
export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
