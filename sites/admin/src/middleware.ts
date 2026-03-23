import { defineMiddleware } from 'astro:middleware';
import { env } from './lib/env';
import { logger } from '@agency/utils/logger';

const AUTH_BASE_URL = env('AUTH_SERVICE_URL') ?? 'https://auth.infront.cy';
const AUTH_TIMEOUT_MS = 5000;
const SESSION_CACHE_TTL_MS = 60_000; // Cache sessions for 60 seconds

const PUBLIC_PATHS = ['/login', '/health'];
const PUBLIC_PREFIXES = ['/api/auth/', '/_astro/', '/assets/'];

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Simple in-memory session cache to avoid hitting auth service on every request
const sessionCache = new Map<string, { data: { user: unknown; session: unknown }; expiresAt: number }>();

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isValidOrigin(request: Request, siteUrl: URL): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const expected = siteUrl.origin;

  // Origin header is most reliable
  if (origin) return origin === expected;
  // Fall back to referer
  if (referer) {
    try {
      return new URL(referer).origin === expected;
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
    return next();
  }

  // CSRF protection: verify Origin header on mutation requests to API routes
  if (MUTATION_METHODS.has(context.request.method) && pathname.startsWith('/api/')) {
    if (!isValidOrigin(context.request, context.url)) {
      return new Response(JSON.stringify({ error: 'CSRF validation failed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Verify session with central auth service (with caching and timeout)
  const cookieHeader = context.request.headers.get('cookie') ?? '';

  // Check session cache first
  const cached = sessionCache.get(cookieHeader);
  if (cached && cached.expiresAt > Date.now()) {
    context.locals.user = cached.data.user;
    context.locals.session = cached.data.session;
    return next();
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
      const loginUrl = `${AUTH_BASE_URL}/login?redirect=${encodeURIComponent(context.url.href)}`;
      return context.redirect(loginUrl);
    }

    const data = await res.json();

    if (!data?.user) {
      const loginUrl = `${AUTH_BASE_URL}/login?redirect=${encodeURIComponent(context.url.href)}`;
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

    return next();
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

    const loginUrl = `${AUTH_BASE_URL}/login?redirect=${encodeURIComponent(context.url.href)}`;
    return context.redirect(loginUrl);
  }
});
