import type { APIRoute } from 'astro';
import { listSites } from '@/lib/sites';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const sites = await listSites();

    return new Response(JSON.stringify(sites), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to list sites:', error);
    return new Response(JSON.stringify({ error: 'Failed to list sites' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
