import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { signChildJWT } from '@/lib/child-auth'
import { CHILD_COOKIE } from '@/lib/child-session'

export async function POST(request: NextRequest) {
  let body: { pin?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { pin } = body
  if (typeof pin !== 'string' || !pin) {
    return NextResponse.json({ error: '`pin` is required' }, { status: 400 })
  }

  // Use service role to read all child profiles — RLS is bypassed intentionally
  // since the child has no Supabase auth session at this point.
  const admin = createAdminClient()
  const { data: profiles, error } = await admin
    .from('child_profile')
    .select('id, parent_id, pin_hash')

  if (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ error: 'No child profile set up yet' }, { status: 404 })
  }

  // Find the first profile whose hash matches the submitted PIN
  let matched: { id: string; parent_id: string } | null = null
  for (const profile of profiles) {
    const ok = await bcrypt.compare(pin, profile.pin_hash)
    if (ok) {
      matched = { id: profile.id, parent_id: profile.parent_id }
      break
    }
  }

  if (!matched) {
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
  }

  const token = await signChildJWT({ sub: matched.id, parent_id: matched.parent_id })

  const response = NextResponse.json({ ok: true })
  response.cookies.set(CHILD_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })
  return response
}
