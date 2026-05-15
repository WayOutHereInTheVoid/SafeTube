'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Server action to handle parent login using email and password.
 * Redirects to the admin dashboard on success, or back to login with an error message on failure.
 *
 * @param formData - The form data containing 'email' and 'password'.
 */
export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  redirect('/admin/dashboard')
}
