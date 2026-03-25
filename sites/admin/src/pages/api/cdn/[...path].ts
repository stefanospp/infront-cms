import type { APIRoute } from 'astro';
import { env } from '../../../lib/env';

export const prerender = false;

/**
 * Proxy to the platform API's /api/cdn-files/* endpoints.
 * Forwards the request with cookies intact so auth flows through.
 *
 * Requires env: PLATFORM_API_URL (e.g. https://api-v2.infront.cy)
 */

// Read at request time via env() helper — process.env is replaced by Vite at build time
function getPlatformApiUrl() { return env('PLATFORM_API_URL') ?? 'http://localhost:3002'; }
function getInternalApiKey() { return env('INTERNAL_API_KEY') ?? ''; }

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function proxyRequest(request: Request, path: string): Promise<Response> {
  const suffix = path ? `/${path}` : '';
  const platformUrl = getPlatformApiUrl();
  const apiKey = getInternalApiKey();
  const url = `${platformUrl}/api/cdn-files${suffix}${new URL(request.url).search}`;

  try {
    const headers = new Headers();
    // Authenticate via internal API key (admin middleware already verified the user)
    if (apiKey) {
      headers.set('x-internal-key', apiKey);
    }

    // Forward content-type for POST/PATCH
    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);

    const init: RequestInit = {
      method: request.method,
      headers,
    };

    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
      // For DELETE with body or POST/PATCH, forward the body
      if (contentType?.includes('application/json')) {
        init.body = await request.text();
      }
    }

    const res = await fetch(url, init);

    return new Response(res.body, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('CDN proxy error:', error);
    return json({ error: 'Failed to reach platform API' }, 502);
  }
}

export const GET: APIRoute = async ({ request, params }) => {
  return proxyRequest(request, params.path || '');
};

export const POST: APIRoute = async ({ request, params }) => {
  return proxyRequest(request, params.path || '');
};

export const PATCH: APIRoute = async ({ request, params }) => {
  return proxyRequest(request, params.path || '');
};

export const DELETE: APIRoute = async ({ request, params }) => {
  return proxyRequest(request, params.path || '');
};
