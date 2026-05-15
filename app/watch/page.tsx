import { redirect } from 'next/navigation'
import { getChildSession } from '@/lib/child-session'
import PinGate from './PinGate'

export default async function WatchPage() {
  const session = await getChildSession()
  if (session) redirect('/watch/play')
  return <PinGate />
}
