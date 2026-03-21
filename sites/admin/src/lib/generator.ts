import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  SiteConfig,
  TemplateDefinition,
  TemplateThemeTokens,
  ThemeConfig,
  ContactConfig,
  SEOConfig,
  NavConfig,
  FooterConfig,
  AnalyticsConfig,
} from '@agency/config';
import { getTemplate } from '@agency/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateSitePayload {
  slug: string;
  name: string;
  tagline: string;
  domain: string;
  tier: 'static' | 'cms' | 'interactive';
  templateId: string;
  theme: ThemeConfig;
  tokens: TemplateThemeTokens;
  contact: ContactConfig;
  seo: SEOConfig;
  nav: NavConfig;
  footer: FooterConfig;
  analytics?: AnalyticsConfig;
}

export interface GeneratorResult {
  success: boolean;
  sitePath: string;
  checklist: string[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the monorepo root from import.meta.url.
 * Path: sites/admin/src/lib/generator.ts -> go up 4 levels to reach root.
 */
export function getMonorepoRoot(): string {
  const thisFile = new URL(import.meta.url).pathname;
  return path.resolve(path.dirname(thisFile), '..', '..', '..', '..');
}

const SLUG_RE = /^[a-z][a-z0-9-]{1,}$/;

function validateSlug(slug: string): string | null {
  if (!SLUG_RE.test(slug)) {
    return 'Slug must be lowercase, start with a letter, contain only letters/numbers/hyphens, and be at least 2 characters.';
  }
  return null;
}

/**
 * Generate the TypeScript source for site.config.ts.
 */
export function generateSiteConfigContent(payload: CreateSitePayload): string {
  const contactStr = JSON.stringify(payload.contact, null, 4);
  const seoStr = JSON.stringify(payload.seo, null, 4);
  const navStr = JSON.stringify(payload.nav, null, 4);
  const footerStr = JSON.stringify(payload.footer, null, 4);
  const themeStr = JSON.stringify(payload.theme, null, 4);
  const analyticsStr = payload.analytics
    ? JSON.stringify(payload.analytics, null, 4)
    : null;

  // Indent helper: add 2-space indent to all lines except the first
  const indent = (str: string, spaces: number): string => {
    const pad = ' '.repeat(spaces);
    return str
      .split('\n')
      .map((line, i) => (i === 0 ? line : pad + line))
      .join('\n');
  };

  return `import type { SiteConfig } from '@agency/config';

const config: SiteConfig = {
  name: ${JSON.stringify(payload.name)},
  tagline: ${JSON.stringify(payload.tagline)},
  url: ${JSON.stringify(`https://${payload.domain}`)},
  locale: 'en-GB',

  contact: ${indent(contactStr, 2)},

  seo: ${indent(seoStr, 2)},

  nav: ${indent(navStr, 2)},

  footer: ${indent(footerStr, 2)},
${analyticsStr ? `\n  analytics: ${indent(analyticsStr, 2)},\n` : ''}
  theme: ${indent(themeStr, 2)},
};

export default config;
`;
}

/**
 * Generate the global.css content with @theme block from tokens.
 */
export function generateGlobalCssContent(tokens: TemplateThemeTokens): string {
  const colorEntries = (
    group: string,
    scale: Record<string, string>,
  ): string => {
    return Object.entries(scale)
      .map(([step, value]) => `  --color-${group}-${step}: ${value};`)
      .join('\n');
  };

  return `@import "tailwindcss";

@source "../../packages/ui/src/**/*.{astro,tsx}";

@theme {
  /* Primary */
${colorEntries('primary', tokens.colors.primary)}

  /* Secondary */
${colorEntries('secondary', tokens.colors.secondary)}

  /* Accent */
${colorEntries('accent', tokens.colors.accent)}

  /* Neutral */
${colorEntries('neutral', tokens.colors.neutral)}

  /* Fonts */
  --font-heading: "${tokens.fonts.heading}", sans-serif;
  --font-body: "${tokens.fonts.body}", sans-serif;
}

/* Base styles */
html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  color: var(--color-neutral-800);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
`;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateSite(
  payload: CreateSitePayload,
): Promise<GeneratorResult> {
  const root = getMonorepoRoot();
  const sitePath = path.join(root, 'sites', payload.slug);
  const checklist: string[] = [];

  try {
    // 1. Validate slug
    const slugError = validateSlug(payload.slug);
    if (slugError) {
      return { success: false, sitePath, checklist: [], error: slugError };
    }

    // 2. Check site doesn't already exist
    try {
      await fs.access(sitePath);
      return {
        success: false,
        sitePath,
        checklist: [],
        error: `Site directory already exists: sites/${payload.slug}`,
      };
    } catch {
      // Directory doesn't exist — good, we can proceed.
    }

    // 3. Validate template exists
    const template = getTemplate(payload.templateId);
    if (!template) {
      return {
        success: false,
        sitePath,
        checklist: [],
        error: `Template not found: ${payload.templateId}`,
      };
    }

    // 4. Copy sites/template/ to sites/{slug}/
    const templatePath = path.join(root, 'sites', 'template');
    await fs.cp(templatePath, sitePath, {
      recursive: true,
      filter: (src) => {
        // Exclude node_modules and dist from the copy
        const basename = path.basename(src);
        return basename !== 'node_modules' && basename !== 'dist';
      },
    });

    // 5. Rewrite package.json
    const pkgPath = path.join(sitePath, 'package.json');
    let pkgContent = await fs.readFile(pkgPath, 'utf-8');
    pkgContent = pkgContent.replace(
      '"@agency/template"',
      `"@agency/${payload.slug}"`,
    );
    await fs.writeFile(pkgPath, pkgContent, 'utf-8');

    // 6. Generate site.config.ts
    const siteConfigContent = generateSiteConfigContent(payload);
    await fs.writeFile(
      path.join(sitePath, 'site.config.ts'),
      siteConfigContent,
      'utf-8',
    );

    // 7. Generate src/styles/global.css
    const globalCssContent = generateGlobalCssContent(payload.tokens);
    await fs.mkdir(path.join(sitePath, 'src', 'styles'), { recursive: true });
    await fs.writeFile(
      path.join(sitePath, 'src', 'styles', 'global.css'),
      globalCssContent,
      'utf-8',
    );

    // 8. Update astro.config.mjs
    const astroConfigPath = path.join(sitePath, 'astro.config.mjs');
    let astroConfig = await fs.readFile(astroConfigPath, 'utf-8');
    astroConfig = astroConfig.replace(
      'https://example.com',
      `https://${payload.domain}`,
    );
    await fs.writeFile(astroConfigPath, astroConfig, 'utf-8');

    // 9. Update public/robots.txt
    const robotsPath = path.join(sitePath, 'public', 'robots.txt');
    let robotsContent = await fs.readFile(robotsPath, 'utf-8');
    robotsContent = robotsContent.replace(/example\.com/g, payload.domain);
    await fs.writeFile(robotsPath, robotsContent, 'utf-8');

    // 10. Write CLAUDE.md
    const claudeMd = `# ${payload.name} — Claude Code Reference

Client site generated from template "${template.name}" on ${new Date().toISOString().split('T')[0]}.

## Key files
- \`site.config.ts\` — site identity, nav, footer, SEO, analytics, theme
- \`src/styles/global.css\` — brand tokens (colours, fonts) via Tailwind @theme
- \`astro.config.mjs\` — Astro configuration, site URL
- \`public/\` — static assets, robots.txt, security headers

## Tier: ${payload.tier}
${payload.tier === 'cms' || payload.tier === 'interactive' ? '- CMS powered by Directus (see infra/docker/' + payload.slug + '/)' : '- Static site, no CMS backend'}

## Customisation checklist
1. Replace favicon and OG image in public/
2. Update \`_headers\` CSP if adding third-party scripts
3. Customise component variants and layouts for each page
4. Add/remove pages as needed
5. Run \`pnpm install\` from monorepo root
6. Run \`pnpm dev --filter @agency/${payload.slug}\` to start dev server
`;
    await fs.writeFile(path.join(sitePath, 'CLAUDE.md'), claudeMd, 'utf-8');

    // 11. If tier is 'cms' or 'interactive': copy docker template
    if (payload.tier === 'cms' || payload.tier === 'interactive') {
      const dockerTemplatePath = path.join(
        root,
        'infra',
        'docker',
        'template',
      );
      const dockerTargetPath = path.join(
        root,
        'infra',
        'docker',
        payload.slug,
      );

      try {
        await fs.access(dockerTemplatePath);
        await fs.cp(dockerTemplatePath, dockerTargetPath, { recursive: true });
        checklist.push(
          `Configure infra/docker/${payload.slug}/.env with database credentials`,
        );
        checklist.push(
          `Start CMS: cd infra/docker/${payload.slug} && docker compose up -d`,
        );
      } catch {
        checklist.push(
          'Docker template not found — manually set up CMS infrastructure',
        );
      }
    }

    // 12. Build checklist
    checklist.push(`Run 'pnpm install' from monorepo root`);
    checklist.push(
      `Run 'pnpm dev --filter @agency/${payload.slug}' to start dev server`,
    );
    checklist.push('Replace favicon and OG image in public/');
    checklist.push('Update _headers CSP if adding third-party scripts');
    checklist.push('Customise page content and component variants');
    if (payload.analytics) {
      checklist.push(
        `Verify ${payload.analytics.provider} analytics with site ID: ${payload.analytics.siteId}`,
      );
    }
    checklist.push('Set up DNS for ' + payload.domain);
    checklist.push('Configure Cloudflare Pages deployment');

    return { success: true, sitePath, checklist };
  } catch (err) {
    // Clean up on failure
    try {
      await fs.rm(sitePath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    return {
      success: false,
      sitePath,
      checklist: [],
      error:
        err instanceof Error ? err.message : 'Unknown error during generation',
    };
  }
}
