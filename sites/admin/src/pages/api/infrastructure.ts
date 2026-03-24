import type { APIRoute } from 'astro';
import { getInfrastructure } from '@/lib/infrastructure';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const data = await getInfrastructure();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to get infrastructure data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get infrastructure data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
