/**
 * Astro-to-Schema parser (best-effort).
 *
 * Extracts a {@link PageSchema} from a `.astro` file string by parsing
 * the frontmatter and template body with regex-based heuristics.
 *
 * This handles the standard patterns produced by the site generator and
 * the schema compiler. Hand-written pages with complex Astro expressions,
 * inline HTML, or conditional rendering will be partially captured at best.
 *
 * @module
 */

import type { PageSchema, SectionSchema } from '@agency/config';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Split an `.astro` file into frontmatter and template body.
 */
function splitAstro(content: string): { frontmatter: string; template: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: '', template: content };
  }
  return { frontmatter: match[1] ?? '', template: match[2] ?? '' };
}

/**
 * Extract the layout component name from imports.
 */
function extractLayout(frontmatter: string): string {
  const match = frontmatter.match(
    /import\s+(\w+)\s+from\s+['"]@agency\/ui\/layouts\/\w+\.astro['"]/,
  );
  return match?.[1] ?? 'FullWidth';
}

/**
 * Extract the page title from frontmatter.
 * Handles: `const title = "About";` and `const title = config.seo.defaultTitle;`
 */
function extractTitle(frontmatter: string): string {
  // String literal
  const strMatch = frontmatter.match(
    /const\s+title\s*=\s*(['"])(.*?)\1/,
  );
  if (strMatch) return strMatch[2] ?? '';

  // Config expression
  const exprMatch = frontmatter.match(
    /const\s+title\s*=\s*([^;]+);/,
  );
  if (exprMatch) return `{${exprMatch[1]!.trim()}}`;

  return '';
}

/**
 * Extract the page description from frontmatter.
 */
function extractDescription(frontmatter: string): string {
  // String literal
  const strMatch = frontmatter.match(
    /const\s+description\s*=\s*(['"])(.*?)\1/,
  );
  if (strMatch) return strMatch[2] ?? '';

  // Template literal (simple case)
  const tmplMatch = frontmatter.match(
    /const\s+description\s*=\s*`([^`]*)`/,
  );
  if (tmplMatch) return tmplMatch[1] ?? '';

  // Config expression
  const exprMatch = frontmatter.match(
    /const\s+description\s*=\s*([^;]+);/,
  );
  if (exprMatch) return `{${exprMatch[1]!.trim()}}`;

  return '';
}

/**
 * Extract CMS collection names from directus import.
 * Matches: `import { getServices, getTestimonials } from '../lib/directus';`
 */
function extractCmsCollections(frontmatter: string): string[] {
  const match = frontmatter.match(
    /import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/lib\/directus['"]/,
  );
  if (!match) return [];

  return (match[1] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('get'))
    .map((s) => {
      // getServices -> services, getTeamMembers -> teamMembers
      const name = s.replace(/^get/, '');
      return name.charAt(0).toLowerCase() + name.slice(1);
    });
}

// ---------------------------------------------------------------------------
// Template parsing
// ---------------------------------------------------------------------------

/**
 * Parse a single attribute value from a tag string.
 *
 * Handles:
 * - `prop="value"` (string)
 * - `prop={expression}` (expression — may contain nested braces)
 * - `client:visible` (boolean flag)
 */
function parseAttributeValue(raw: string): unknown {
  const trimmed = raw.trim();

  // Quoted string
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  // Expression wrapped in braces
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const inner = trimmed.slice(1, -1).trim();

    // Try JSON parse for arrays/objects
    try {
      return JSON.parse(inner);
    } catch {
      // Return as config expression string
      return `{${inner}}`;
    }
  }

  return trimmed;
}

/**
 * Extract all attributes from a component tag.
 *
 * This uses a state-machine approach to handle nested braces properly.
 */
function extractAttributes(
  tagContent: string,
): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  let i = 0;

  while (i < tagContent.length) {
    // Skip whitespace
    while (i < tagContent.length && /\s/.test(tagContent[i]!)) i++;
    if (i >= tagContent.length) break;

    // Check for client directive (client:visible, client:idle, etc.)
    if (tagContent.slice(i).startsWith('client:')) {
      const end = tagContent.indexOf(' ', i);
      const directive = tagContent.slice(
        i,
        end === -1 ? tagContent.length : end,
      );
      attrs[directive] = true;
      i = end === -1 ? tagContent.length : end;
      continue;
    }

    // Read attribute name
    const nameStart = i;
    while (
      i < tagContent.length &&
      tagContent[i] !== '=' &&
      !/\s/.test(tagContent[i]!) &&
      tagContent[i] !== '/'
    ) {
      i++;
    }
    const name = tagContent.slice(nameStart, i).trim();
    if (!name || name === '/') break;

    // Skip '='
    if (i < tagContent.length && tagContent[i] === '=') {
      i++;
    } else {
      // Boolean attribute
      attrs[name] = true;
      continue;
    }

    // Read value
    if (i >= tagContent.length) break;

    if (tagContent[i] === '"' || tagContent[i] === "'") {
      const quote = tagContent[i]!;
      i++;
      const valStart = i;
      while (i < tagContent.length && tagContent[i] !== quote) i++;
      attrs[name] = tagContent.slice(valStart, i);
      i++; // skip closing quote
    } else if (tagContent[i] === '{') {
      // Brace-delimited expression — track nesting depth
      let depth = 0;
      const valStart = i;
      while (i < tagContent.length) {
        if (tagContent[i] === '{') depth++;
        else if (tagContent[i] === '}') {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        i++;
      }
      const raw = tagContent.slice(valStart, i);
      attrs[name] = parseAttributeValue(raw);
    } else {
      // Unquoted value (rare in Astro)
      const valStart = i;
      while (i < tagContent.length && !/\s/.test(tagContent[i]!)) i++;
      attrs[name] = tagContent.slice(valStart, i);
    }
  }

  return attrs;
}

/**
 * Create a scoped ID generator for a single parse call.
 * Avoids module-level mutable state that would break concurrent parsing.
 */
function createIdGenerator(): (component: string) => string {
  let counter = 0;
  return (component: string): string => {
    counter++;
    return `${component.toLowerCase()}-${counter}`;
  };
}

/** Module-level reference set per parse call via parseAstroToSchema */
let nextId: (component: string) => string = createIdGenerator();

/**
 * Known layout components — used to identify the layout wrapper.
 */
const LAYOUT_NAMES = new Set([
  'FullWidth',
  'SingleColumn',
  'WithSidebar',
  'BlogPost',
  'BaseLayout',
]);

/**
 * Components that are structural wrappers (Section) rather than content.
 */
const WRAPPER_COMPONENTS = new Set(['Section']);

/**
 * Parse a top-level component tag from the template body.
 *
 * Handles both self-closing `<Component ... />` and paired
 * `<Component ...>...</Component>` tags.
 */
function parseTopLevelComponents(template: string): SectionSchema[] {
  const sections: SectionSchema[] = [];

  // Find the layout wrapper and get its inner content
  let inner = template;
  for (const layout of LAYOUT_NAMES) {
    const openPattern = new RegExp(`<${layout}[^>]*>`);
    const closePattern = new RegExp(`</${layout}>`);
    const openMatch = inner.match(openPattern);
    const closeMatch = inner.match(closePattern);
    if (openMatch && closeMatch) {
      const startIdx = (openMatch.index ?? 0) + openMatch[0].length;
      const endIdx = closeMatch.index ?? inner.length;
      inner = inner.slice(startIdx, endIdx);
      break;
    }
  }

  // Scan for top-level components by tracking indent
  const lines = inner.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // Skip empty lines, comments, conditional expressions
    if (
      !trimmed ||
      trimmed.startsWith('<!--') ||
      trimmed.startsWith('{') ||
      trimmed.startsWith('}')
    ) {
      i++;
      continue;
    }

    // Match component opening tag
    const componentMatch = trimmed.match(/^<([A-Z]\w*)/);
    if (!componentMatch) {
      i++;
      continue;
    }

    const componentName = componentMatch[1]!;

    // Collect the full tag (may span multiple lines)
    let tagContent = '';
    let depth = 0;
    const tagStartLine = i;

    // Self-closing tag check
    if (trimmed.endsWith('/>')) {
      tagContent = trimmed;
      i++;
    } else {
      // Multi-line tag or paired tag — collect until we find the close
      const collected: string[] = [];

      while (i < lines.length) {
        const l = lines[i]!.trim();
        collected.push(l);

        // Check for self-closing end
        if (l.endsWith('/>') && depth === 0) {
          i++;
          break;
        }

        // Track open/close tags for this component
        const opens = (l.match(new RegExp(`<${componentName}(?:\\s|>|\\/)`, 'g')) ?? []).length;
        const closes = (l.match(new RegExp(`</${componentName}>`, 'g')) ?? []).length;

        // First line has the opening tag
        if (i === tagStartLine && l.includes('>') && !l.endsWith('/>')) {
          depth = 1;
        } else {
          depth += opens - closes;
        }

        if (depth <= 0 && i > tagStartLine) {
          i++;
          break;
        }

        i++;
      }

      tagContent = collected.join('\n');
    }

    // Parse this component
    const section = parseComponentToSection(componentName, tagContent);
    if (section) {
      sections.push(section);
    }
  }

  return sections;
}

/**
 * Convert a parsed component tag into a SectionSchema.
 *
 * If the component is a `Section` wrapper, extracts the inner component
 * as the section content and lifts heading/background/id to the schema.
 */
function parseComponentToSection(
  componentName: string,
  tagContent: string,
): SectionSchema | null {
  if (WRAPPER_COMPONENTS.has(componentName)) {
    return parseSectionWrapper(tagContent);
  }

  // Extract attributes from the tag
  // Remove the tag name and closing
  const attrContent = extractTagAttributes(componentName, tagContent);
  const attrs = extractAttributes(attrContent);

  const variant = typeof attrs.variant === 'string' ? attrs.variant : undefined;
  const clientDirective = extractClientDirective(attrs);
  const isIsland = clientDirective != null;

  // Remove non-prop attributes
  delete attrs.variant;
  for (const key of Object.keys(attrs)) {
    if (key.startsWith('client:')) delete attrs[key];
  }

  return {
    id: nextId(componentName),
    component: componentName,
    variant,
    props: attrs as Record<string, unknown>,
    isIsland: isIsland || undefined,
    clientDirective: clientDirective || undefined,
  };
}

/**
 * Parse a `<Section>` wrapper and extract its inner component.
 */
function parseSectionWrapper(tagContent: string): SectionSchema | null {
  // Extract Section attributes
  const sectionAttrContent = extractTagAttributes('Section', tagContent);
  const sectionAttrs = extractAttributes(sectionAttrContent);

  const heading =
    typeof sectionAttrs.heading === 'string'
      ? sectionAttrs.heading
      : undefined;
  const subheading =
    typeof sectionAttrs.subheading === 'string'
      ? sectionAttrs.subheading
      : undefined;
  const background = (
    typeof sectionAttrs.background === 'string'
      ? sectionAttrs.background
      : undefined
  ) as 'light' | 'dark' | 'primary' | undefined;
  const sectionId =
    typeof sectionAttrs.id === 'string' ? sectionAttrs.id : undefined;

  // Extract inner content (between <Section ...> and </Section>)
  const innerMatch = tagContent.match(
    /<Section[^>]*>([\s\S]*)<\/Section>/,
  );

  if (!innerMatch) {
    // Self-closing Section (unlikely but handle it)
    return {
      id: nextId('section'),
      component: 'Section',
      props: {},
      heading,
      subheading,
      background,
      sectionId,
    };
  }

  const innerContent = innerMatch[1]!.trim();

  // Find the first component inside the Section
  const innerComponentMatch = innerContent.match(/^(?:[\s\S]*?)<([A-Z]\w*)/);
  if (!innerComponentMatch) {
    // Section with only raw HTML — cannot represent as schema section
    return {
      id: nextId('section'),
      component: 'Section',
      props: {},
      heading,
      subheading,
      background,
      sectionId,
    };
  }

  const innerComponentName = innerComponentMatch[1]!;
  // Find the inner component's full tag
  const innerTagPattern = new RegExp(
    `<${innerComponentName}[\\s\\S]*?(?:\\/>|<\\/${innerComponentName}>)`,
  );
  const innerTagMatch = innerContent.match(innerTagPattern);

  if (!innerTagMatch) {
    return {
      id: nextId('section'),
      component: 'Section',
      props: {},
      heading,
      subheading,
      background,
      sectionId,
    };
  }

  const innerAttrContent = extractTagAttributes(
    innerComponentName,
    innerTagMatch[0],
  );
  const innerAttrs = extractAttributes(innerAttrContent);

  const variant =
    typeof innerAttrs.variant === 'string' ? innerAttrs.variant : undefined;
  const clientDirective = extractClientDirective(innerAttrs);
  const isIsland = clientDirective != null;

  delete innerAttrs.variant;
  for (const key of Object.keys(innerAttrs)) {
    if (key.startsWith('client:')) delete innerAttrs[key];
  }

  return {
    id: nextId(innerComponentName),
    component: innerComponentName,
    variant,
    props: innerAttrs as Record<string, unknown>,
    heading,
    subheading,
    background,
    sectionId,
    isIsland: isIsland || undefined,
    clientDirective: clientDirective || undefined,
  };
}

/**
 * Extract the attribute portion of a component tag (everything between
 * `<ComponentName ` and the first `>` or `/>` that isn't inside braces).
 */
function extractTagAttributes(
  componentName: string,
  tagContent: string,
): string {
  // Find the opening tag
  const openPattern = new RegExp(`<${componentName}\\s*`);
  const match = tagContent.match(openPattern);
  if (!match) return '';

  const start = (match.index ?? 0) + match[0].length;

  // Walk forward, tracking brace depth, until we find > or />
  let depth = 0;
  let i = start;
  while (i < tagContent.length) {
    const ch = tagContent[i]!;
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (depth === 0) {
      if (ch === '/' && tagContent[i + 1] === '>') {
        return tagContent.slice(start, i).trim();
      }
      if (ch === '>') {
        return tagContent.slice(start, i).trim();
      }
    }
    i++;
  }

  return tagContent.slice(start).trim();
}

/**
 * Extract client directive from attributes.
 */
function extractClientDirective(
  attrs: Record<string, unknown>,
): 'visible' | 'idle' | 'load' | null {
  for (const key of Object.keys(attrs)) {
    if (key === 'client:visible') return 'visible';
    if (key === 'client:idle') return 'idle';
    if (key === 'client:load') return 'load';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse an `.astro` file content string and extract a best-effort {@link PageSchema}.
 *
 * This handles the standard patterns produced by the site generator and the
 * schema compiler:
 * - Layout wrapper detection
 * - Component + variant extraction
 * - `<Section>` wrapper unwrapping (heading, background, id)
 * - CMS collection detection from directus imports
 * - Title / description extraction from frontmatter
 *
 * Pages with complex Astro expressions, inline HTML, or conditional rendering
 * will be partially captured. The parser is intended for migration and
 * round-tripping, not for arbitrary Astro files.
 *
 * @param content - The `.astro` file content as a string
 * @param pageName - The page filename without extension (e.g. "index", "about")
 * @returns A {@link PageSchema} representation of the page
 *
 * @example
 * ```ts
 * import { parseAstroToSchema } from '@agency/utils';
 * import * as fs from 'node:fs';
 *
 * const content = fs.readFileSync('sites/my-site/src/pages/index.astro', 'utf-8');
 * const schema = parseAstroToSchema(content, 'index');
 * ```
 */
export function parseAstroToSchema(
  content: string,
  pageName: string,
): PageSchema {
  nextId = createIdGenerator();

  const { frontmatter, template } = splitAstro(content);
  const layout = extractLayout(frontmatter);
  const title = extractTitle(frontmatter);
  const description = extractDescription(frontmatter);
  const cmsCollections = extractCmsCollections(frontmatter);
  const sections = parseTopLevelComponents(template);

  return {
    page: pageName,
    title: title || pageName,
    layout,
    seo: {
      title: title || undefined,
      description: description || undefined,
    },
    sections,
    cmsCollections: cmsCollections.length > 0 ? cmsCollections : undefined,
  };
}
