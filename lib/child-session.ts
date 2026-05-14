import { cookies } from 'next/headers'
import { verifyChildJWT, type ChildJWTPayload } from './child-auth'

export const CHILD_COOKIE = 'safetube_child_session'

export async function getChildSession(): Promise<ChildJWTPayload | null> {
  const token = cookies().get(CHILD_COOKIE)?.value
  if (!token) return null
  try {
    return await verifyChildJWT(token)
  } catch {
    return null
  }
}
