/**
 * Schema-to-Astro compiler.
 *
 * Converts a {@link PageSchema} into a valid `.astro` file string that
 * follows all project conventions (import ordering, indentation, Section
 * wrapping, CMS data-fetching).
 *
 * @module
 */

import type { PageSchema, SectionSchema } from '@agency/config';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Components known to live in `@agency/ui/islands/` (React) instead of `components/` */
const ISLAND_COMPONENTS = new Set(['ContactForm', 'CookieConsent', 'MobileNav']);

/**
 * Serialise a prop value into an Astro template expression.
 *
 * - Strings become `"quoted"` literals.
 * - Config expressions like `{config.seo.defaultTitle}` are passed through.
 * - Numbers / booleans become `{value}`.
 * - Arrays / objects become `{JSON-literal}` with pretty-printing.
 */
function serializePropValue(value: unknown): string {
  if (typeof value === 'string') {
    // Config references like {config.name} stay as expressions
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
  return `{${JSON.stringify(value, null, 2)}}`;
}

/**
 * Render a component invocation with its props as Astro attributes.
 *
 * Returns the string for a self-closing tag like:
 * ```
 *   <Hero variant="centered" heading="Hello" />
 * ```
 */
function renderComponentTag(
  section: SectionSchema,
  indent: number,
): string {
  const pad = '  '.repeat(indent);
  const tag = section.component;
  const attrs: string[] = [];

  // Variant
  if (section.variant) {
    const variantVal = serializePropValue(section.variant);
    attrs.push(`variant=${variantVal}`);
  }

  // Client directive for islands
  const isIsland =
    section.isIsland ?? ISLAND_COMPONENTS.has(section.component);
  if (isIsland && section.clientDirective) {
    attrs.push(`client:${section.clientDirective}`);
  } else if (isIsland) {
    attrs.push('client:visible');
  }

  // Remaining props
  for (const [key, value] of Object.entries(section.props)) {
    const serialized = serializePropValue(value);
    attrs.push(`${key}=${serialized}`);
  }

  // Format: single line for few attrs, multi-line for many
  if (attrs.length <= 2) {
    const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    return `${pad}<${tag}${attrStr} />`;
  }

  // Multi-line attribute formatting
  const attrPad = '  '.repeat(indent + 1);
  const formattedAttrs = attrs
    .map((a) => `${attrPad}${a}`)
    .join('\n');
  return `${pad}<${tag}\n${formattedAttrs}\n${pad}/>`;
}

// ---------------------------------------------------------------------------
// Section rendering
// ---------------------------------------------------------------------------

/**
 * Render a single section (optionally wrapped in a `<Section>` component).
 */
function renderSection(section: SectionSchema, indent: number): string {
  const pad = '  '.repeat(indent);
  const needsWrapper =
    section.heading != null ||
    section.subheading != null ||
    section.background != null ||
    section.sectionId != null;

  // Editor bridge data attributes for inline editing
  const bridgeAttrs = `data-section-id="${section.id}" data-component="${section.component}"`;

  if (!needsWrapper) {
    // Wrap in a div with bridge attributes so the editor can target it
    const inner = renderComponentTag(section, indent + 1);
    return `${pad}<div ${bridgeAttrs}>\n${inner}\n${pad}</div>`;
  }

  // Build Section wrapper attributes
  const wrapperAttrs: string[] = [bridgeAttrs];
  if (section.heading) {
    wrapperAttrs.push(`heading="${section.heading}"`);
  }
  if (section.subheading) {
    wrapperAttrs.push(`subheading="${section.subheading}"`);
  }
  if (section.background) {
    wrapperAttrs.push(`background="${section.background}"`);
  }
  if (section.sectionId) {
    wrapperAttrs.push(`id="${section.sectionId}"`);
  }

  const wrapperAttrStr =
    wrapperAttrs.length > 0 ? ' ' + wrapperAttrs.join(' ') : '';
  const inner = renderComponentTag(section, indent + 1);

  return `${pad}<Section${wrapperAttrStr}>\n${inner}\n${pad}</Section>`;
}

// ---------------------------------------------------------------------------
// Import resolution
// ---------------------------------------------------------------------------

/**
 * Build the list of import statements for a page.
 */
function buildImports(schema: PageSchema): string[] {
  const lines: string[] = [];

  // Global CSS import always first
  lines.push('import "../styles/global.css";');

  // Layout
  lines.push(
    `import ${schema.layout} from '@agency/ui/layouts/${schema.layout}.astro';`,
  );

  // Collect unique component names
  const components = new Set<string>();
  let needsSection = false;

  for (const section of schema.sections) {
    components.add(section.component);
    const hasWrapper =
      section.heading != null ||
      section.subheading != null ||
      section.background != null ||
      section.sectionId != null;
    if (hasWrapper) {
      needsSection = true;
    }
  }

  // Always import Section if any section uses a wrapper
  if (needsSection) {
    components.add('Section');
  }

  // Sort components alphabetically for deterministic output
  const sorted = [...components].sort();

  for (const name of sorted) {
    const isIsland = ISLAND_COMPONENTS.has(name);
    if (isIsland) {
      lines.push(`import ${name} from '@agency/ui/islands/${name}';`);
    } else {
      lines.push(
        `import ${name} from '@agency/ui/components/${name}.astro';`,
      );
    }
  }

  // CMS utilities
  if (schema.cmsCollections && schema.cmsCollections.length > 0) {
    lines.push("import { getDirectusImageUrl } from '@agency/utils';");
  }

  // Site config — always last
  lines.push("import config from '../../site.config';");

  return lines;
}

// ---------------------------------------------------------------------------
// CMS data-fetching block
// ---------------------------------------------------------------------------

/**
 * Generate CMS data-fetching boilerplate in the frontmatter.
 *
 * For each collection, creates:
 * ```ts
 * const rawCollectionName = await getCollectionName();
 * ```
 *
 * The actual mapping logic is site-specific, so we generate a TODO comment
 * reminding the developer to add mapping code. For the round-trip case
 * (parser -> editor -> compiler) the raw fetch calls are enough.
 */
function buildCmsBlock(collections: string[]): string[] {
  if (collections.length === 0) return [];

  const lines: string[] = [''];

  // Build a combined import for the directus helpers
  const fnNames = collections.map(
    (c) => `get${c.charAt(0).toUpperCase()}${c.slice(1)}`,
  );
  lines.push(
    `import { ${fnNames.join(', ')} } from '../lib/directus';`,
  );
  lines.push('');

  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i]!;
    const fnName = fnNames[i]!;
    const varName = `raw${collection.charAt(0).toUpperCase()}${collection.slice(1)}`;
    lines.push(`const ${varName} = await ${fnName}();`);
  }

  lines.push('// TODO: map raw CMS data to component props');

  return lines;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compile a {@link PageSchema} into a valid `.astro` file string.
 *
 * The output matches existing project conventions:
 * - `global.css` import first
 * - Layout, component, utility, then config imports
 * - `title` / `description` constants in frontmatter
 * - Layout wrapper with `title`, `description`, and `config` props
 * - Sections rendered with proper indentation
 *
 * @param schema - The page schema to compile
 * @returns A complete `.astro` file as a string
 *
 * @example
 * ```ts
 * import { compilePageSchema } from '@agency/utils';
 * import type { PageSchema } from '@agency/config';
 *
 * const schema: PageSchema = {
 *   page: 'index',
 *   title: 'Home',
 *   layout: 'FullWidth',
 *   seo: { description: 'Welcome' },
 *   sections: [
 *     { id: 'hero-1', component: 'Hero', variant: 'centered', props: { heading: 'Hello' } },
 *   ],
 * };
 *
 * const astroFile = compilePageSchema(schema);
 * ```
 */
export function compilePageSchema(schema: PageSchema): string {
  const imports = buildImports(schema);
  const cmsBlock = buildCmsBlock(schema.cmsCollections ?? []);

  // Title expression
  const titleValue = schema.seo.title ?? schema.title;
  const titleExpr = titleValue.startsWith('{') && titleValue.endsWith('}')
    ? `const title = ${titleValue.slice(1, -1)};`
    : `const title = ${JSON.stringify(titleValue)};`;

  // Description expression
  const descValue = schema.seo.description ?? '';
  const descExpr = descValue.startsWith('{') && descValue.endsWith('}')
    ? `const description = ${descValue.slice(1, -1)};`
    : `const description = ${JSON.stringify(descValue)};`;

  // Render sections
  const sectionBlocks = schema.sections.map((s) => renderSection(s, 1));
  const sectionsStr = sectionBlocks.join('\n\n');

  // Assemble
  const frontmatter = [
    ...imports,
    ...cmsBlock,
    '',
    titleExpr,
    descExpr,
  ].join('\n');

  const template = [
    `<${schema.layout} title={title} description={description} config={config}>`,
    sectionsStr,
    `</${schema.layout}>`,
  ].join('\n');

  return `---\n${frontmatter}\n---\n\n${template}\n`;
}
