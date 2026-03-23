import type { APIRoute } from 'astro';
import { readDeployMetadata } from '@/lib/deploy';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!;
  const meta = await readDeployMetadata(slug);

  if (!meta) {
    return new Response(JSON.stringify({ error: 'Site not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(meta), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
