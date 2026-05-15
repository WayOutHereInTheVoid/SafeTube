import { redirect } from 'next/navigation'
import { getChildSession } from '@/lib/child-session'
import PlayerClient from './PlayerClient'

export default async function PlayPage() {
  const session = await getChildSession()
  if (!session) redirect('/watch')
  return <PlayerClient />
}
