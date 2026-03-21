import type { APIRoute } from 'astro';
import { listTemplates } from '@agency/config';

export const GET: APIRoute = async () => {
  const templates = listTemplates();

  return new Response(JSON.stringify(templates), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
