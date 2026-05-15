import { createClient } from '@/lib/supabase/server'
import type { ApprovedChannel } from '@/types/database'
import ChannelsClient from './ChannelsClient'

/**
 * The channel management page for the admin panel.
 * Fetches approved channels and renders the client-side channel management interface.
 *
 * @returns A channel management page component.
 */
export default async function ChannelsPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('approved_channels')
    .select('*')
    .order('created_at', { ascending: false })

  return <ChannelsClient initialChannels={(data ?? []) as ApprovedChannel[]} />
}
