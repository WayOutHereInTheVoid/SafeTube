import { cookies } from 'next/headers'
import { verifyChildJWT, type ChildJWTPayload } from './child-auth'

/**
 * The name of the cookie used to store the child session JWT.
 */
export const CHILD_COOKIE = 'safetube_child_session'

/**
 * Retrieves and verifies the child session from the request cookies.
 *
 * @returns A promise that resolves to the ChildJWTPayload if a valid session exists, or null otherwise.
 */
export async function getChildSession(): Promise<ChildJWTPayload | null> {
  const token = cookies().get(CHILD_COOKIE)?.value
  if (!token) return null
  try {
    return await verifyChildJWT(token)
  } catch {
    return null
  }
}
