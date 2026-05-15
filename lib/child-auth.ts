import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.CHILD_JWT_SECRET!)

/**
 * Payload structure for the child session JWT.
 */
export interface ChildJWTPayload {
  /** The child profile ID. */
  sub: string       // child_profile_id
  /** The ID of the parent who owns this child profile. */
  parent_id: string
}

/**
 * Signs a JWT for a child session.
 *
 * @param payload - The payload containing child profile and parent ID.
 * @returns A promise that resolves to the signed JWT string.
 */
export async function signChildJWT(payload: ChildJWTPayload): Promise<string> {
  return new SignJWT({ parent_id: payload.parent_id })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
}

/**
 * Verifies a child session JWT and returns its payload.
 *
 * @param token - The JWT string to verify.
 * @returns A promise that resolves to the decoded ChildJWTPayload.
 * @throws Error if the token is invalid or missing required fields.
 */
export async function verifyChildJWT(token: string): Promise<ChildJWTPayload> {
  const { payload } = await jwtVerify(token, secret)
  if (typeof payload.sub !== 'string' || typeof payload.parent_id !== 'string') {
    throw new Error('Invalid token payload')
  }
  return { sub: payload.sub, parent_id: payload.parent_id as string }
}
