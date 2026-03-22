import type { APIRoute } from 'astro';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { getMonorepoRoot } from '@/lib/generator';
import { getPageSchema, savePageSchema } from '@/lib/page-schemas';

export const prerender = false;

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const sectionSchemaZod: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    component: z.string().min(1),
    variant: z.string().optional(),
    props: z.record(z.unknown()),
    background: z.enum(['light', 'dark', 'primary']).optional(),
    heading: z.string().optional(),
    subheading: z.string().optional(),
    sectionId: z.string().optional(),
    isIsland: z.boolean().optional(),
    clientDirective: z.enum(['visible', 'idle', 'load']).optional(),
  }),
);

const pageSchemaZod = z.object({
  page: z.string().min(1),
  title: z.string().min(1),
  layout: z.string().min(1),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
  }),
  sections: z.array(sectionSchemaZod),
  cmsCollections: z.array(z.string()).optional(),
});

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!;
  const page = params.page!;

  if (!SLUG_PATTERN.test(slug)) {
    return json({ error: 'Invalid slug format' }, 400);
  }

  // Check that the site directory exists
  const siteDir = path.join(getMonorepoRoot(), 'sites', slug);
  try {
    const stat = await fs.stat(siteDir);
    if (!stat.isDirectory()) {
      return json({ error: 'Site not found' }, 404);
    }
  } catch {
    return json({ error: 'Site not found' }, 404);
  }

  try {
    const schema = await getPageSchema(slug, page);
    if (!schema) {
      return json({ error: `Page "${page}" not found` }, 404);
    }
    return json({ schema }, 200);
  } catch (err) {
    console.error(`Error getting page schema for ${slug}/${page}:`, err);
    return json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      500,
    );
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;
  const page = params.page!;

  if (!SLUG_PATTERN.test(slug)) {
    return json({ error: 'Invalid slug format' }, 400);
  }

  // Check that the site directory exists
  const siteDir = path.join(getMonorepoRoot(), 'sites', slug);
  try {
    const stat = await fs.stat(siteDir);
    if (!stat.isDirectory()) {
      return json({ error: 'Site not found' }, 404);
    }
  } catch {
    return json({ error: 'Site not found' }, 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = pageSchemaZod.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const schema = parsed.data as import('@agency/config').PageSchema;

  // Ensure the page name in the body matches the URL parameter
  if (schema.page !== page) {
    return json(
      { error: `Page name in body ("${schema.page}") does not match URL parameter ("${page}")` },
      400,
    );
  }

  try {
    await savePageSchema(slug, schema);
    return json({ schema }, 200);
  } catch (err) {
    console.error(`Error saving page schema for ${slug}/${page}:`, err);
    return json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      500,
    );
  }
};
