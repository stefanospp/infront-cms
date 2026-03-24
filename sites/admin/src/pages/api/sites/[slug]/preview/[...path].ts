import type { APIRoute } from 'astro';
import { devServerManager } from '@/lib/dev-server';

export const prerender = false;

/**
 * Reverse proxy to the internal Vite dev server running for a site.
 * This allows the editor preview iframe to work on production (web.infront.cy)
 * where the browser can't directly reach localhost:{port} inside the container.
 */
export const ALL: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;
  const proxyPath = params.path || '';

  const server = devServerManager.getStatus(slug);
  if (!server || (server.status !== 'running' && server.status !== 'starting')) {
    return new Response(
      JSON.stringify({ error: 'Dev server not running' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const targetUrl = `http://localhost:${server.port}/${proxyPath}`;

  try {
    // Forward the request to the internal dev server
    const headers = new Headers();
    // Pass through relevant headers
    for (const [key, value] of request.headers.entries()) {
      if (
        key === 'host' ||
        key === 'connection' ||
        key === 'transfer-encoding'
      ) {
        continue;
      }
      headers.set(key, value);
    }

    const proxyRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body:
        request.method !== 'GET' && request.method !== 'HEAD'
          ? request.body
          : undefined,
      redirect: 'manual',
    });

    // Forward the response back, stripping hop-by-hop headers
    const resHeaders = new Headers();
    for (const [key, value] of proxyRes.headers.entries()) {
      if (key === 'transfer-encoding' || key === 'connection') continue;
      resHeaders.set(key, value);
    }

    // Allow the iframe to load this content
    resHeaders.delete('x-frame-options');
    resHeaders.set('x-proxied-from', `localhost:${server.port}`);

    return new Response(proxyRes.body, {
      status: proxyRes.status,
      headers: resHeaders,
    });
  } catch (err) {
    console.error(`[preview-proxy] Error proxying to ${targetUrl}:`, err);
    return new Response(
      JSON.stringify({
        error: 'Failed to proxy to dev server',
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
