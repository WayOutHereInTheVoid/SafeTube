import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware function to handle Supabase authentication and session management.
 * It refreshes the user session and protects admin routes.
 *
 * @param request - The incoming Next.js request object.
 * @returns A NextResponse object that either proceeds to the next middleware/route or redirects.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Retrieves all cookies from the request.
         */
        getAll() {
          return request.cookies.getAll()
        },
        /**
         * Updates cookies on both the request and response objects to ensure session persistence.
         *
         * @param cookiesToSet - An array of cookie objects to be set.
         */
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Must call getUser() immediately after createServerClient — do not insert code between them
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redirect to login if trying to access admin routes without an active session
  if (pathname.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect to admin dashboard if trying to access login/signup with an active session
  if ((pathname === '/login' || pathname === '/signup') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

/**
 * Configuration for the middleware, defining which routes it should run on.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
