import type { APIRoute } from 'astro';
import { redeploySite, readDeployMetadata } from '@/lib/deploy';
import { auditLog } from '@agency/utils/logger';

export const prerender = false;

export const POST: APIRoute = async ({ params }) => {
  const slug = params.slug!;
  auditLog('site.redeploy', { slug });
  const meta = await readDeployMetadata(slug);

  if (!meta) {
    return new Response(JSON.stringify({ error: 'Site not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (meta.status === 'building' || meta.status === 'deploying') {
    return new Response(
      JSON.stringify({
        error: 'A deploy is already in progress',
        status: meta.status,
      }),
      {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // Fire-and-forget — do not await
  redeploySite(slug).catch((err) => {
    console.error(`Redeploy failed for ${slug}:`, err);
  });

  return new Response(
    JSON.stringify({ status: 'building', message: 'Redeploy started' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
