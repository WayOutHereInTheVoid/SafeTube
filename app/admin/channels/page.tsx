import { createClient } from '@/lib/supabase/server'
import type { ApprovedChannel } from '@/types/database'
import ChannelsClient from './ChannelsClient'

export default async function ChannelsPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('approved_channels')
    .select('*')
    .order('created_at', { ascending: false })

  return <ChannelsClient initialChannels={(data ?? []) as ApprovedChannel[]} />
}
