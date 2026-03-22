import type { APIRoute } from 'astro';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { getMonorepoRoot } from '@/lib/generator';
import { addSection, removeSection } from '@/lib/page-schemas';

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

const addSectionSchema = z.object({
  section: sectionSchemaZod,
  position: z.number().int().min(0).optional(),
});

const removeSectionSchema = z.object({
  sectionId: z.string().min(1),
});

async function validateSiteExists(slug: string): Promise<Response | null> {
  if (!SLUG_PATTERN.test(slug)) {
    return json({ error: 'Invalid slug format' }, 400);
  }

  const siteDir = path.join(getMonorepoRoot(), 'sites', slug);
  try {
    const stat = await fs.stat(siteDir);
    if (!stat.isDirectory()) {
      return json({ error: 'Site not found' }, 404);
    }
  } catch {
    return json({ error: 'Site not found' }, 404);
  }

  return null;
}

export const POST: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;
  const page = params.page!;

  const validationError = await validateSiteExists(slug);
  if (validationError) return validationError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = addSectionSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const { section, position } = parsed.data;

  try {
    const schema = await addSection(
      slug,
      page,
      section as import('@agency/config').SectionSchema,
      position,
    );
    return json({ schema }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 500;
    console.error(`Error adding section to ${slug}/${page}:`, err);
    return json({ error: message }, status);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;
  const page = params.page!;

  const validationError = await validateSiteExists(slug);
  if (validationError) return validationError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = removeSectionSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const { sectionId } = parsed.data;

  try {
    const schema = await removeSection(slug, page, sectionId);
    return json({ schema }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 500;
    console.error(`Error removing section from ${slug}/${page}:`, err);
    return json({ error: message }, status);
  }
};
