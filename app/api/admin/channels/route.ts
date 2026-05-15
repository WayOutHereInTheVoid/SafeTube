import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import type { ApprovalMode } from '@/types/database'

const VALID_MODES: ApprovalMode[] = ['auto', 'manual', 'current_only']

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { youtube_channel_id, channel_title, thumbnail_url, approval_mode, auto_approve_new } =
    body

  if (
    typeof youtube_channel_id !== 'string' ||
    typeof channel_title !== 'string' ||
    !VALID_MODES.includes(approval_mode as ApprovalMode)
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('approved_channels')
    .insert({
      parent_id: user.id,
      youtube_channel_id,
      channel_title,
      thumbnail_url: thumbnail_url ?? null,
      approval_mode,
      auto_approve_new: Boolean(auto_approve_new),
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Channel already added' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ channel: data }, { status: 201 })
}
