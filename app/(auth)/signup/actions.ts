'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Server action to handle parent sign-up using email and password.
 * Redirects to the admin dashboard on success, or to login with a message if email confirmation is required.
 *
 * @param formData - The form data containing 'email' and 'password'.
 */
export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect('/signup?error=' + encodeURIComponent(error.message))
  }

  // If session is null, Supabase requires email confirmation
  if (!data.session) {
    redirect('/login?message=' + encodeURIComponent('Check your email to confirm your account, then sign in.'))
  }

  redirect('/admin/dashboard')
}
