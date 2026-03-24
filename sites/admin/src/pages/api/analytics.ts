import type { APIRoute } from 'astro';
import { getWorkersAnalytics } from '@/lib/analytics';

export const prerender = false;

const VALID_PERIODS = new Set(['24h', '7d', '30d']);

export const GET: APIRoute = async ({ url }) => {
  try {
    const periodParam = url.searchParams.get('period') ?? '24h';
    const period = VALID_PERIODS.has(periodParam)
      ? (periodParam as '24h' | '7d' | '30d')
      : '24h';

    const data = await getWorkersAnalytics(period);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch analytics' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
