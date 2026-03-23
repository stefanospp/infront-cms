import type { APIRoute } from 'astro';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { getMonorepoRoot } from '@/lib/generator';

export const prerender = false;

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// ---------------------------------------------------------------------------
// Zod schemas for site config validation
// ---------------------------------------------------------------------------

const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  postcode: z.string(),
  country: z.string(),
  region: z.string().optional(),
});

const contactSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  address: addressSchema.optional(),
});

const navItemSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    label: z.string(),
    href: z.string(),
    children: z.array(navItemSchema).optional(),
  }),
);

const navSchema = z.object({
  items: z.array(navItemSchema),
  cta: z
    .object({
      label: z.string(),
      href: z.string(),
    })
    .optional(),
});

const footerSchema = z.object({
  columns: z.array(
    z.object({
      title: z.string(),
      links: z.array(z.object({ label: z.string(), href: z.string() })),
    }),
  ),
  socials: z
    .object({
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      youtube: z.string().optional(),
      github: z.string().optional(),
    })
    .optional(),
  legalLinks: z.array(z.object({ label: z.string(), href: z.string() })),
  text: z.string().optional(),
});

const seoSchema = z.object({
  defaultTitle: z.string(),
  titleTemplate: z.string(),
  defaultDescription: z.string(),
  defaultOgImage: z.string(),
  structuredData: z
    .object({ type: z.string() })
    .catchall(z.unknown())
    .optional(),
});

const themeSchema = z.object({
  navStyle: z.enum(['sticky', 'fixed', 'static']),
  footerStyle: z.enum(['simple', 'multi-column', 'minimal']),
  heroDefault: z.enum(['centered', 'split', 'fullscreen', 'minimal', 'video']),
  borderStyle: z.enum(['sharp', 'rounded', 'pill']),
});

const siteConfigSchema = z.object({
  name: z.string().min(1),
  tagline: z.string(),
  url: z.string(),
  locale: z.string(),
  contact: contactSchema,
  seo: seoSchema,
  nav: navSchema,
  footer: footerSchema,
  analytics: z
    .object({
      provider: z.enum(['plausible', 'fathom', 'google']),
      siteId: z.string(),
    })
    .optional(),
  cms: z.object({ url: z.string() }).optional(),
  theme: themeSchema,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getConfigPath(slug: string): string {
  return path.join(getMonorepoRoot(), 'sites', slug, 'site.config.ts');
}

/**
 * Parse site.config.ts to extract the config object.
 * We read the raw TypeScript and extract the default export object.
 */
async function readSiteConfig(slug: string): Promise<Record<string, unknown> | null> {
  const configPath = getConfigPath(slug);
  try {
    const content = await fs.readFile(configPath, 'utf-8');

    // Try to extract the JSON-like config from the TS file.
    // site.config.ts has: export default { ... } satisfies SiteConfig;
    // We strip the import/export wrapper and parse.

    // Remove import lines
    const withoutImports = content
      .replace(/^import\s+.*;\s*$/gm, '')
      .trim();

    // Extract the object between the first { and the matching }
    const match = withoutImports.match(
      /(?:export\s+default\s+)(\{[\s\S]*\})\s*(?:satisfies\s+\w+\s*)?;?\s*$/,
    );

    if (!match?.[1]) return null;

    // Convert TS-style object to JSON-parseable format:
    // - Remove trailing commas
    // - Quote unquoted keys
    // This is a best-effort approach; the canonical read would use
    // ts-node or a proper TS evaluator.
    let objStr = match[1];

    // Replace single-quoted strings with double-quoted
    objStr = objStr.replace(/'/g, '"');

    // Remove trailing commas before } or ]
    objStr = objStr.replace(/,\s*([\]}])/g, '$1');

    // Remove comments
    objStr = objStr.replace(/\/\/.*$/gm, '');
    objStr = objStr.replace(/\/\*[\s\S]*?\*\//g, '');

    try {
      return JSON.parse(objStr);
    } catch {
      // Fallback: try to evaluate with a more lenient parser
      // For now, return null and log
      console.warn(`Could not parse site config for ${slug} — use the file editor`);
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Write a site config object back to site.config.ts.
 */
async function writeSiteConfig(
  slug: string,
  config: Record<string, unknown>,
): Promise<void> {
  const configPath = getConfigPath(slug);

  const content = `import type { SiteConfig } from '@agency/config';

export default ${JSON.stringify(config, null, 2)} satisfies SiteConfig;
`;

  await fs.writeFile(configPath, content, 'utf-8');
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!;

  if (!SLUG_PATTERN.test(slug)) {
    return json({ error: 'Invalid slug format' }, 400);
  }

  const siteDir = path.join(getMonorepoRoot(), 'sites', slug);
  try {
    const stat = await fs.stat(siteDir);
    if (!stat.isDirectory()) return json({ error: 'Site not found' }, 404);
  } catch {
    return json({ error: 'Site not found' }, 404);
  }

  try {
    const config = await readSiteConfig(slug);
    if (!config) {
      return json({ error: 'Could not parse site config' }, 500);
    }
    return json({ config }, 200);
  } catch (err) {
    console.error(`Error reading config for ${slug}:`, err);
    return json(
      { error: 'Internal server error' },
      500,
    );
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;

  if (!SLUG_PATTERN.test(slug)) {
    return json({ error: 'Invalid slug format' }, 400);
  }

  const siteDir = path.join(getMonorepoRoot(), 'sites', slug);
  try {
    const stat = await fs.stat(siteDir);
    if (!stat.isDirectory()) return json({ error: 'Site not found' }, 404);
  } catch {
    return json({ error: 'Site not found' }, 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = siteConfigSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  try {
    await writeSiteConfig(slug, parsed.data as Record<string, unknown>);
    return json({ config: parsed.data }, 200);
  } catch (err) {
    console.error(`Error saving config for ${slug}:`, err);
    return json(
      { error: 'Internal server error' },
      500,
    );
  }
};
