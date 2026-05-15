import { createClient } from '@/lib/supabase/server'
import type { ApprovedVideo } from '@/types/database'
import VideosClient from './VideosClient'

export default async function VideosPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('approved_videos')
    .select('*')
    .order('created_at', { ascending: false })

  return <VideosClient initialVideos={(data ?? []) as ApprovedVideo[]} />
}
