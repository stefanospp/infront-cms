import { SignJWT, jwtVerify } from 'jose';
import { compare } from 'bcryptjs';

/**
 * Verify a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return compare(plain, hash);
}

/**
 * Create a signed JWT session token with 24-hour expiry.
 */
export async function createSessionToken(secret: string): Promise<string> {
  const key = new TextEncoder().encode(secret);

  return new SignJWT({ role: 'admin' })
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
