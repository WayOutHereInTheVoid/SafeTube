import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with administrative privileges using the service role key.
 * This client should only be used in server-side environments and never exposed to the client.
 *
 * @returns A Supabase client with full administrative access.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
