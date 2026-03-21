import type { APIRoute } from 'astro';
import { readDeployMetadata, writeDeployMetadata } from '@/lib/deploy';
import { addCustomDomain, removeCustomDomain } from '@/lib/cloudflare';

export const POST: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;

  let body: { domain?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const domain = body.domain?.trim();
  if (!domain) {
    return new Response(
      JSON.stringify({ error: 'domain is required and must be non-empty' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const meta = await readDeployMetadata(slug);
  if (!meta) {
    return new Response(JSON.stringify({ error: 'Site not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await addCustomDomain(meta.projectName, domain);

    meta.productionUrl = domain;
    await writeDeployMetadata(slug, meta);

    return new Response(
      JSON.stringify({ success: true, productionUrl: domain }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Failed to add custom domain',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;

  let body: { domain?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const domain = body.domain?.trim();

  const meta = await readDeployMetadata(slug);
  if (!meta) {
    return new Response(JSON.stringify({ error: 'Site not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await removeCustomDomain(meta.projectName, domain ?? meta.productionUrl ?? '');

    meta.productionUrl = null;
    await writeDeployMetadata(slug, meta);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Failed to remove custom domain',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
