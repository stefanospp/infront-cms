import type { APIRoute } from 'astro';
import { z } from 'zod';
import { generateSite } from '@/lib/generator';
import type { CreateSitePayload } from '@/lib/generator';
import { writeDeployMetadata, deployNewSite } from '@/lib/deploy';
import { auditLog } from '@agency/utils/logger';

export const prerender = false;
import type { DeployMetadata } from '@/lib/deploy';

const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  postcode: z.string(),
  country: z.string(),
  region: z.string().optional(),
});

const colorScaleSchema = z.object({
  50: z.string(),
  100: z.string(),
  200: z.string(),
  300: z.string(),
  400: z.string(),
  500: z.string(),
  600: z.string(),
  700: z.string(),
  800: z.string(),
  900: z.string(),
  950: z.string(),
});

const createSiteSchema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(
      /^[a-z][a-z0-9-]+$/,
      'Slug must be lowercase, start with a letter, and contain only letters, numbers, and hyphens',
    ),
  name: z.string().min(1, 'Name is required'),
  tagline: z.string().min(1, 'Tagline is required'),
  domain: z.string().min(3, 'Domain is required'),
  tier: z.enum(['static', 'cms', 'interactive']),
  templateId: z.string().min(1),
  theme: z.object({
    navStyle: z.enum(['sticky', 'fixed', 'static']),
    footerStyle: z.enum(['simple', 'multi-column', 'minimal']),
    heroDefault: z.enum(['centered', 'split', 'fullscreen', 'minimal']),
    borderStyle: z.enum(['sharp', 'rounded', 'pill']),
  }),
  tokens: z.object({
    colors: z.object({
      primary: colorScaleSchema,
      secondary: colorScaleSchema,
      accent: colorScaleSchema,
      neutral: colorScaleSchema,
    }),
    fonts: z.object({
      heading: z.string().min(1),
      body: z.string().min(1),
    }),
  }),
  contact: z.object({
    email: z.string().email().or(z.literal('')),
    phone: z.string().optional(),
    address: addressSchema.optional(),
  }),
  seo: z.object({
    defaultTitle: z.string(),
    titleTemplate: z.string(),
    defaultDescription: z.string(),
    defaultOgImage: z.string(),
    structuredData: z
      .object({
        type: z.string(),
      })
      .passthrough()
      .optional(),
  }),
  nav: z.object({
    items: z.array(
      z.object({
        label: z.string().min(1),
        href: z.string().min(1),
        children: z
          .array(
            z.object({
              label: z.string().min(1),
              href: z.string().min(1),
            }),
          )
          .optional(),
      }),
    ),
    cta: z
      .object({
        label: z.string().min(1),
        href: z.string().min(1),
      })
      .optional(),
  }),
  footer: z.object({
    columns: z.array(
      z.object({
        title: z.string().min(1),
        links: z.array(
          z.object({
            label: z.string().min(1),
            href: z.string().min(1),
          }),
        ),
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
    legalLinks: z.array(
      z.object({
        label: z.string().min(1),
        href: z.string().min(1),
      }),
    ),
    text: z.string().optional(),
  }),
  analytics: z
    .object({
      provider: z.enum(['plausible', 'fathom', 'google']),
      siteId: z.string().min(1),
    })
    .optional(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const parsed = createSiteSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const payload: CreateSitePayload = parsed.data;

    auditLog('site.create', { slug: payload.slug, tier: payload.tier, template: payload.templateId });

    const result = await generateSite(payload);

    if (!result.success) {
      return new Response(JSON.stringify(result), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Write initial deploy metadata and kick off background deployment
    const stagingUrl = `${payload.slug}.infront.cy`;
    const initialMeta: DeployMetadata = {
      projectName: payload.slug,
      stagingUrl,
      productionUrl: null,
      workersDevUrl: `${payload.slug}.workers.dev`,
      lastDeployId: null,
      lastDeployAt: null,
      status: 'pending',
      error: null,
      dnsRecordId: null,
      buildLog: null,
    };
    await writeDeployMetadata(payload.slug, initialMeta);

    // Fire-and-forget: deploy in background
    deployNewSite(payload.slug).catch((err) => {
      console.error(`Background deploy failed for ${payload.slug}:`, err);
    });

    return new Response(
      JSON.stringify({
        ...result,
        stagingUrl: `https://${stagingUrl}`,
        deployStatus: 'pending',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('Site creation error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error:
          err instanceof Error ? err.message : 'Internal server error',
        sitePath: '',
        checklist: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
