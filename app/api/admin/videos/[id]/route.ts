import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import type { ApprovalStatus } from '@/types/database'

const VALID_STATUSES: ApprovalStatus[] = ['approved', 'pending', 'rejected']

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const { approval_status } = body

  if (!VALID_STATUSES.includes(approval_status as ApprovalStatus)) {
    return NextResponse.json({ error: 'Invalid approval_status' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('approved_videos')
    .update({ approval_status })
    .eq('id', params.id)
    .eq('parent_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ video: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('approved_videos')
    .delete()
    .eq('id', params.id)
    .eq('parent_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
