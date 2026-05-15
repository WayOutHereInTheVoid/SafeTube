import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const EDGE_FN_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-channel-uploads`

export async function POST() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_id: user.id }),
    })

    const data = await res.json() as Record<string, unknown>

    if (!res.ok) {
      return NextResponse.json(
        { error: (data.error as string) ?? 'Sync failed' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Could not reach sync function' }, { status: 502 })
  }
}
