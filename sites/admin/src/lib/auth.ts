import { SignJWT, jwtVerify } from 'jose';
import bcryptjs from 'bcryptjs';
const { compare } = bcryptjs;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = 'admin' | 'client';

export interface SessionPayload {
  role: UserRole;
  /** For client users: which site slugs they can access */
  allowedSites?: string[];
}

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

/**
 * Verify a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return compare(plain, hash);
}

// ---------------------------------------------------------------------------
// JWT tokens
// ---------------------------------------------------------------------------

/**
 * Create a signed JWT session token with 24-hour expiry.
 */
export async function createSessionToken(
  secret: string,
  payload: SessionPayload = { role: 'admin' },
): Promise<string> {
  const key = new TextEncoder().encode(secret);

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('agency-admin')
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

/**
 * Verify a JWT session token. Returns true if valid, false otherwise.
 */
export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<boolean> {
  try {
    const key = new TextEncoder().encode(secret);
    await jwtVerify(token, key, { issuer: 'agency-admin' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify and extract the payload from a JWT session token.
 * Returns null if the token is invalid.
 */
export async function getSessionPayload(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key, { issuer: 'agency-admin' });
    return {
      role: (payload.role as UserRole) ?? 'client',
      allowedSites: payload.allowedSites as string[] | undefined,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Authorization helpers
// ---------------------------------------------------------------------------

/**
 * Check if a session has access to a specific site.
 * Admins have access to all sites. Clients only have access to allowedSites.
 */
export function canAccessSite(
  session: SessionPayload,
  slug: string,
): boolean {
  if (session.role === 'admin') return true;
  return session.allowedSites?.includes(slug) ?? false;
}

/**
 * Check if a session has admin privileges.
 */
export function isAdmin(session: SessionPayload): boolean {
  return session.role === 'admin';
}
