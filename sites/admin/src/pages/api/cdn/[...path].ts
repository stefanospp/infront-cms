import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Proxy to the platform API's /api/cdn-files/* endpoints.
 * Forwards the request with cookies intact so auth flows through.
 *
 * Requires env: PLATFORM_API_URL (e.g. https://api-v2.infront.cy)
 */

const PLATFORM_API_URL = import.meta.env.PLATFORM_API_URL || process.env.PLATFORM_API_URL || 'http://localhost:3002';

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function proxyRequest(request: Request, path: string): Promise<Response> {
  const url = `${PLATFORM_API_URL}/api/cdn-files/${path}${new URL(request.url).search}`;

  try {
    const headers = new Headers();
    // Forward cookies for auth
    const cookie = request.headers.get('cookie');
    if (cookie) headers.set('cookie', cookie);

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
