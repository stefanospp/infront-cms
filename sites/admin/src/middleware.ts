import { env } from '@/lib/env';
import { defineMiddleware } from 'astro:middleware';
import { verifySessionToken } from './lib/auth';

/** Routes that do not require authentication. */
const PUBLIC_PATHS = ['/login'];
const PUBLIC_PREFIXES = ['/api/auth/'];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (isPublicRoute(pathname)) {
    return next();
  }

  const sessionCookie = context.cookies.get('session')?.value;

  if (!sessionCookie) {
    return context.redirect('/login');
  }

  const secret = env('SESSION_SECRET');

  if (!secret) {
    console.error('SESSION_SECRET environment variable is not set');
    return context.redirect('/login');
  }

  const valid = await verifySessionToken(sessionCookie, secret);

  if (!valid) {
    return context.redirect('/login');
  }

  return next();
});
