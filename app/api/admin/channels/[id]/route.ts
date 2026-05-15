import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import type { ApprovalMode } from '@/types/database'

const VALID_MODES: ApprovalMode[] = ['auto', 'manual', 'current_only']

/**
 * DELETE handler for removing an approved channel.
 *
 * @param _request - The incoming request object.
 * @param context - The context containing route parameters (channel ID).
 * @returns A JSON response indicating success or failure.
 */
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
    .from('approved_channels')
    .delete()
    .eq('id', params.id)
    .eq('parent_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

/**
 * PATCH handler for updating a channel's approval mode.
 *
 * @param request - The incoming request containing the new approval_mode.
 * @param context - The context containing route parameters (channel ID).
 * @returns A JSON response containing the updated channel record.
 */
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

  const { approval_mode, auto_approve_new } = body

  if (!VALID_MODES.includes(approval_mode as ApprovalMode)) {
    return NextResponse.json({ error: 'Invalid approval_mode' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('approved_channels')
    .update({ approval_mode, auto_approve_new: Boolean(auto_approve_new) })
    .eq('id', params.id)
    .eq('parent_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ channel: data })
}
