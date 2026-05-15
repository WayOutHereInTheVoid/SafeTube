import { redirect } from 'next/navigation'
import { getChildSession } from '@/lib/child-session'
import PlayerClient from './PlayerClient'

/**
 * The main player page for children.
 * Requires a valid child session, otherwise redirects to the PIN gate.
 *
 * @returns A player page component.
 */
export default async function PlayPage() {
  const session = await getChildSession()
  if (!session) redirect('/watch')
  return <PlayerClient />
}
