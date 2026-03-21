import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  SiteConfig,
  TemplateDefinition,
  TemplateThemeTokens,
  TemplateColorScale,
  TemplatePageDefinition,
  TemplateSectionDefinition,
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
 * Resolve the monorepo root.
 * Hardcoded to /app for Docker. For local dev, override via MONOREPO_ROOT env.
 */
export function getMonorepoRoot(): string {
  return process.env.MONOREPO_ROOT || '/app';
}

const SLUG_RE = /^[a-z][a-z0-9-]{1,62}$/;

function validateSlug(slug: string): string | null {
  if (!SLUG_RE.test(slug)) {
    return 'Slug must be lowercase, start with a letter, contain only letters/numbers/hyphens, and be 2–63 characters.';
  }
  return null;
}

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

function validateDomain(domain: string): string | null {
  if (!DOMAIN_RE.test(domain)) {
    return 'Domain must be a valid hostname (lowercase letters, numbers, hyphens, dots).';
  }
  return null;
}

/** Strip characters that could break CSS string interpolation */
function sanitizeFont(name: string): string {
  return name.replace(/["\\;{}]/g, '');
}

/** Validate a CSS color value (hex, rgb, hsl, oklch) */
const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|(?:rgb|hsl|oklch)a?\([^)]+\))$/;

function validateColor(value: string): boolean {
  return COLOR_RE.test(value);
}

/**
 * Generate the TypeScript source for site.config.ts.
 */
export function generateSiteConfigContent(payload: CreateSitePayload): string {
  // Apply fallback defaults for empty fields
  const contact = { ...payload.contact };
  if (!contact.email) contact.email = `info@${payload.domain}`;

  const seo = { ...payload.seo };
  if (!seo.defaultTitle) seo.defaultTitle = payload.name;
  if (!seo.titleTemplate) seo.titleTemplate = `%s | ${payload.name}`;
  if (!seo.defaultDescription) seo.defaultDescription = `Welcome to ${payload.name}`;
  if (!seo.defaultOgImage) seo.defaultOgImage = '/og-default.jpg';

  const contactStr = JSON.stringify(contact, null, 4);
  const seoStr = JSON.stringify(seo, null, 4);
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
    scale: TemplateColorScale,
  ): string => {
    return (Object.entries(scale) as [string, string][])
      .map(([step, value]) => `  --color-${group}-${step}: ${value};`)
      .join('\n');
  };

  return `@import "tailwindcss";

@source "../../../../packages/ui/src/**/*.{astro,tsx}";
@source "../components/**/*.{astro,tsx}";

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
  --font-heading: "${sanitizeFont(tokens.fonts.heading)}", sans-serif;
  --font-body: "${sanitizeFont(tokens.fonts.body)}", sans-serif;
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

/**
 * Generate the astro.config.mjs content with component override plugin.
 */
export function generateAstroConfigContent(domain: string): string {
  return `import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { componentOverridePlugin } from '@agency/utils';

export default defineConfig({
  site: 'https://${domain}',
  output: 'static',
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    plugins: [
      tailwindcss(),
      componentOverridePlugin(import.meta.dirname),
    ],
  },
  image: {
    domains: ['cms.${domain}'],
  },
});
`;
}

// ---------------------------------------------------------------------------
// Page generation from template definitions
// ---------------------------------------------------------------------------

/** Components that need `config` passed as a prop */
const CONFIG_COMPONENTS = new Set(['ContactSection', 'Nav', 'Footer']);

/** Pages that are kept from the template scaffold (not generated) */
const STATIC_PAGES = new Set(['privacy', 'terms', '404']);

/**
 * Resolve the import path for a component.
 * Islands live in @agency/ui/islands/, everything else in @agency/ui/components/.
 */
function getComponentImportPath(section: TemplateSectionDefinition): string {
  if (section.isIsland) {
    return `@agency/ui/islands/${section.component}`;
  }
  return `@agency/ui/components/${section.component}.astro`;
}

/**
 * Collect all unique component imports from a sections tree (including children).
 * Returns a Map of componentName → importPath.
 */
function collectImports(
  sections: TemplateSectionDefinition[],
): Map<string, string> {
  const imports = new Map<string, string>();
  for (const section of sections) {
    if (!imports.has(section.component)) {
      imports.set(section.component, getComponentImportPath(section));
    }
    if (section.children) {
      const childImports = collectImports(section.children);
      for (const [name, path] of childImports) {
        if (!imports.has(name)) imports.set(name, path);
      }
    }
  }
  return imports;
}

/**
 * Serialize a JavaScript value into a string suitable for Astro template expressions.
 * Objects and arrays become `{...}` expressions; strings become quoted literals.
 */
function serializePropValue(value: unknown): string {
  if (typeof value === 'string') {
    // Check for config references like {config.seo.defaultTitle}
    if (value.startsWith('{') && value.endsWith('}')) {
      return value;
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `{${value}}`;
  }
  if (value === null || value === undefined) {
    return '{undefined}';
  }
  // Arrays and objects — use JSON.stringify and wrap in expression
  return `{${JSON.stringify(value, null, 2)}}`;
}

/**
 * Render a single section as an Astro component invocation string.
 */
function renderSection(
  section: TemplateSectionDefinition,
  indentLevel: number,
): string {
  const pad = '  '.repeat(indentLevel);
  const tag = section.component;
  const attrs: string[] = [];

  // Add variant prop
  if (section.variant) {
    attrs.push(`variant="${section.variant}"`);
  }

  // Add client directive for islands
  if (section.isIsland && section.clientDirective) {
    attrs.push(`client:${section.clientDirective}`);
  }

  // Add config prop if the component needs it
  if (CONFIG_COMPONENTS.has(section.component)) {
    attrs.push('config={config}');
  }

  // Add remaining props
  for (const [key, value] of Object.entries(section.props)) {
    const serialized = serializePropValue(value);
    attrs.push(`${key}=${serialized}`);
  }

  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

  // Self-closing if no children
  if (!section.children || section.children.length === 0) {
    return `${pad}<${tag}${attrStr} />`;
  }

  // With children
  const childrenStr = section.children
    .map((child) => renderSection(child, indentLevel + 1))
    .join('\n');

  return `${pad}<${tag}${attrStr}>\n${childrenStr}\n${pad}</${tag}>`;
}

/**
 * Generate the full .astro file content for a template page definition.
 */
export function generatePageFile(page: TemplatePageDefinition): string {
  // Skip static pages
  if (STATIC_PAGES.has(page.slug)) {
    return '';
  }

  // Collect imports
  const layoutImportName = page.layout;
  const layoutImportPath = `@agency/ui/layouts/${page.layout}.astro`;
  const componentImports = collectImports(page.sections);

  // Build import statements
  const importLines: string[] = [
    `import "../styles/global.css";`,
    `import ${layoutImportName} from '${layoutImportPath}';`,
  ];

  for (const [name, importPath] of componentImports) {
    importLines.push(`import ${name} from '${importPath}';`);
  }

  importLines.push(`import config from '../../site.config';`);

  // Resolve title and description (may reference config)
  const titleExpr = page.title.startsWith('{')
    ? `const title = ${page.title.slice(1, -1)};`
    : `const title = ${JSON.stringify(page.title)};`;

  const descExpr = page.description.startsWith('{')
    ? `const description = ${page.description.slice(1, -1)};`
    : `const description = ${JSON.stringify(page.description)};`;

  // Render sections
  const sectionsStr = page.sections
    .map((s) => renderSection(s, 1))
    .join('\n\n');

  return `---
${importLines.join('\n')}

${titleExpr}
${descExpr}
---

<${layoutImportName} title={title} description={description} config={config}>
${sectionsStr}
</${layoutImportName}>
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
    // 1. Validate slug and domain
    const slugError = validateSlug(payload.slug);
    if (slugError) {
      return { success: false, sitePath, checklist: [], error: slugError };
    }

    const domainError = validateDomain(payload.domain);
    if (domainError) {
      return { success: false, sitePath, checklist: [], error: domainError };
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

    // 5. Delete hardcoded page files (will be regenerated from template)
    const pagesDir = path.join(sitePath, 'src', 'pages');
    const pagesToDelete = ['index.astro', 'about.astro', 'contact.astro'];
    for (const pageFile of pagesToDelete) {
      try {
        await fs.unlink(path.join(pagesDir, pageFile));
      } catch {
        // File may not exist — that's fine
      }
    }

    // 6. Generate pages from template definition
    for (const page of template.pages) {
      if (STATIC_PAGES.has(page.slug)) continue;
      const pageContent = generatePageFile(page);
      if (pageContent) {
        const pagePath = page.slug === 'index'
          ? path.join(pagesDir, 'index.astro')
          : path.join(pagesDir, `${page.slug}.astro`);
        await fs.writeFile(pagePath, pageContent, 'utf-8');
      }
    }

    // 7. Create empty src/components/ for site-specific overrides
    await fs.mkdir(path.join(sitePath, 'src', 'components'), { recursive: true });

    // 8. Rewrite package.json
    const pkgPath = path.join(sitePath, 'package.json');
    let pkgContent = await fs.readFile(pkgPath, 'utf-8');
    pkgContent = pkgContent.replace(
      '"@agency/template"',
      `"@agency/${payload.slug}"`,
    );
    await fs.writeFile(pkgPath, pkgContent, 'utf-8');

    // 9. Generate site.config.ts
    const siteConfigContent = generateSiteConfigContent(payload);
    await fs.writeFile(
      path.join(sitePath, 'site.config.ts'),
      siteConfigContent,
      'utf-8',
    );

    // 10. Generate src/styles/global.css
    const globalCssContent = generateGlobalCssContent(payload.tokens);
    await fs.mkdir(path.join(sitePath, 'src', 'styles'), { recursive: true });
    await fs.writeFile(
      path.join(sitePath, 'src', 'styles', 'global.css'),
      globalCssContent,
      'utf-8',
    );

    // 11. Update astro.config.mjs (site URL + component override plugin)
    const astroConfigPath = path.join(sitePath, 'astro.config.mjs');
    const astroConfigContent = generateAstroConfigContent(payload.domain);
    await fs.writeFile(astroConfigPath, astroConfigContent, 'utf-8');

    // 12. Update public/robots.txt
    const robotsPath = path.join(sitePath, 'public', 'robots.txt');
    let robotsContent = await fs.readFile(robotsPath, 'utf-8');
    robotsContent = robotsContent.replace(/example\.com/g, payload.domain);
    await fs.writeFile(robotsPath, robotsContent, 'utf-8');

    // 13. Write CLAUDE.md
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

    // 14. If tier is 'cms' or 'interactive': copy docker template
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

    // 15. Build checklist
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
