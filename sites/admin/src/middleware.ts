import { defineMiddleware } from 'astro:middleware';
import { env } from './lib/env';
import { logger } from '@agency/utils/logger';

const AUTH_BASE_URL = env('AUTH_SERVICE_URL') ?? 'https://auth.infront.cy';
const PUBLIC_ADMIN_URL = env('PUBLIC_ADMIN_URL') ?? 'https://web.infront.cy';
const AUTH_TIMEOUT_MS = 5000;
const SESSION_CACHE_TTL_MS = 60_000; // Cache sessions for 60 seconds
const SESSION_COOKIE_NAME = 'better-auth.session_token';

const PUBLIC_PATHS = ['/login', '/health'];
const PUBLIC_PREFIXES = ['/_astro/', '/assets/'];

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Simple in-memory session cache to avoid hitting auth service on every request
const sessionCache = new Map<string, { data: { user: unknown; session: unknown }; expiresAt: number }>();

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isValidOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  // Check against the public URL (not container's localhost)
  const publicOrigin = new URL(PUBLIC_ADMIN_URL).origin;

  // Origin header is most reliable
  if (origin) return origin === publicOrigin;
  // Fall back to referer
  if (referer) {
    try {
      return new URL(referer).origin === publicOrigin;
    } catch {
      return false;
    }
  }
  // No origin/referer — reject mutations from unknown sources
  return false;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (isPublicRoute(pathname)) {
    const response = await next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }

  // CSRF protection: verify Origin header on mutation requests to API routes
  if (MUTATION_METHODS.has(context.request.method) && pathname.startsWith('/api/')) {
    if (!isValidOrigin(context.request)) {
      return new Response(JSON.stringify({ error: 'CSRF validation failed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Verify session with central auth service (with caching and timeout)
  // Extract only the auth session cookie to avoid leaking unrelated cookies
  // Cookie may have __Secure- or __Host- prefix in production (HTTPS)
  const rawCookies = context.request.headers.get('cookie') ?? '';
  const cookieHeader = rawCookies
    .split(';')
    .map((c) => c.trim())
    .filter((c) => c.includes(`${SESSION_COOKIE_NAME}=`))
    .join('; ');

  // Check session cache first
  const cached = sessionCache.get(cookieHeader);
  if (cached && cached.expiresAt > Date.now()) {
    context.locals.user = cached.data.user;
    context.locals.session = cached.data.session;
    const response = await next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

    const res = await fetch(`${AUTH_BASE_URL}/api/auth/get-session`, {
      headers: { cookie: cookieHeader },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const loginUrl = `${AUTH_BASE_URL}/login?redirect=${encodeURIComponent(PUBLIC_ADMIN_URL + context.url.pathname)}`;
      return context.redirect(loginUrl);
    }

    const data = await res.json();

    if (!data?.user) {
      const loginUrl = `${AUTH_BASE_URL}/login?redirect=${encodeURIComponent(PUBLIC_ADMIN_URL + context.url.pathname)}`;
      return context.redirect(loginUrl);
    }

    // Cache the session
    sessionCache.set(cookieHeader, {
      data: { user: data.user, session: data.session },
      expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
    });

    // Attach user to locals for downstream use
    context.locals.user = data.user;
    context.locals.session = data.session;

    const response = await next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    logger.error('Auth service unreachable', {
      error: err instanceof Error ? err.message : String(err),
      path: pathname,
      timeout: isTimeout,
    });

    // If auth service is down, return 503 instead of redirect loop
    if (isTimeout || (err instanceof TypeError && err.message.includes('fetch'))) {
      return new Response('Auth service unavailable. Please try again shortly.', { status: 503 });
    }

    const loginUrl = `${AUTH_BASE_URL}/login?redirect=${encodeURIComponent(PUBLIC_ADMIN_URL + context.url.pathname)}`;
    return context.redirect(loginUrl);
  }
});
