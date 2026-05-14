import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.CHILD_JWT_SECRET!)

export interface ChildJWTPayload {
  sub: string       // child_profile_id
  parent_id: string
}

export async function signChildJWT(payload: ChildJWTPayload): Promise<string> {
  return new SignJWT({ parent_id: payload.parent_id })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
}

export async function verifyChildJWT(token: string): Promise<ChildJWTPayload> {
  const { payload } = await jwtVerify(token, secret)
  if (typeof payload.sub !== 'string' || typeof payload.parent_id !== 'string') {
    throw new Error('Invalid token payload')
  }
  return { sub: payload.sub, parent_id: payload.parent_id as string }
}
