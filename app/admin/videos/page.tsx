import { createClient } from '@/lib/supabase/server'
import type { ApprovedVideo } from '@/types/database'
import VideosClient from './VideosClient'

/**
 * The video management page for the admin panel.
 * Fetches existing videos and renders the client-side video management interface.
 *
 * @returns A video management page component.
 */
export default async function VideosPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('approved_videos')
    .select('*')
    .order('created_at', { ascending: false })

  return <VideosClient initialVideos={(data ?? []) as ApprovedVideo[]} />
}
