import { redirect } from 'next/navigation'
import { getChildSession } from '@/lib/child-session'
import PinGate from './PinGate'

/**
 * The entry page for children to access the player.
 * If a valid child session exists, redirects to the player page.
 * Otherwise, displays the PIN entry gate.
 *
 * @returns A watch page component.
 */
export default async function WatchPage() {
  const session = await getChildSession()
  if (session) redirect('/watch/play')
  return <PinGate />
}
