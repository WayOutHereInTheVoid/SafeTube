import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Route handler for the Supabase authentication callback.
 * It exchanges an auth code for a session and redirects the user.
 *
 * @param request - The incoming request object.
 * @returns A redirect response to the admin dashboard or login page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Could not verify email — please try again.')}`
  )
}
