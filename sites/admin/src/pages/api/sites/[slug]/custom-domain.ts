import type { APIRoute } from 'astro';
import { readDeployMetadata, writeDeployMetadata } from '@/lib/deploy';
import { addWorkerCustomDomain, removeWorkerCustomDomain } from '@/lib/cloudflare';
import { auditLog } from '@agency/utils/logger';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;
  auditLog('site.custom-domain', { slug });

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

  // Validate hostname format (e.g. example.com, sub.example.co.uk)
  const hostnameRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  if (!hostnameRegex.test(domain)) {
    return new Response(
      JSON.stringify({ error: 'Invalid hostname format. Expected something like example.com' }),
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
    await addWorkerCustomDomain(meta.projectName, domain);

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
    console.error(`Error adding custom domain for ${slug}:`, err);
    return new Response(
      JSON.stringify({
        error: 'Failed to add custom domain',
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
    await removeWorkerCustomDomain(meta.projectName, domain ?? meta.productionUrl ?? '');

    meta.productionUrl = null;
    await writeDeployMetadata(slug, meta);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(`Error removing custom domain for ${slug}:`, err);
    return new Response(
      JSON.stringify({
        error: 'Failed to remove custom domain',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
