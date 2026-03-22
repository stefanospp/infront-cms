import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { PageSchema, SectionSchema } from '@agency/config';
import { getMonorepoRoot } from './generator';
import { compilePageSchema } from '../../../../packages/utils/src/schema-compiler';
import { parseAstroToSchema } from '../../../../packages/utils/src/schema-parser';

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

function getSitePagesDir(slug: string): string {
  return path.join(getMonorepoRoot(), 'sites', slug, 'src', 'pages');
}

function getSchemasDir(slug: string): string {
  return path.join(getMonorepoRoot(), 'sites', slug, 'src', 'schemas');
}

function getSchemaPath(slug: string, page: string): string {
  return path.join(getSchemasDir(slug), `${page}.json`);
}

function getAstroPath(slug: string, page: string): string {
  return path.join(getSitePagesDir(slug), `${page}.astro`);
}

// ---------------------------------------------------------------------------
// Exclusion filter
// ---------------------------------------------------------------------------

/** Files/patterns to exclude from page listing */
function shouldExcludePage(filename: string): boolean {
  // Exclude API routes (inside api/ subdirectory — handled at directory level)
  // Exclude [...slug].astro catch-all routes
  if (filename.startsWith('[...')) return true;
  // Exclude partials starting with _
  if (filename.startsWith('_')) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get all page schemas for a site.
 * Reads from the schemas/ directory first, falls back to parsing .astro files.
 */
export async function listPageSchemas(slug: string): Promise<PageSchema[]> {
  const pagesDir = getSitePagesDir(slug);
  const schemas: PageSchema[] = [];

  let entries: string[];
  try {
    entries = await fs.readdir(pagesDir);
  } catch {
    return [];
  }

  for (const entry of entries) {
    // Skip directories (e.g. api/, blog/)
    const fullPath = path.join(pagesDir, entry);
    let stat;
    try {
      stat = await fs.stat(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) continue;

    // Only process .astro files
    if (!entry.endsWith('.astro')) continue;

    const pageName = entry.replace(/\.astro$/, '');
    if (shouldExcludePage(entry)) continue;

    const schema = await getPageSchema(slug, pageName);
    if (schema) {
      schemas.push(schema);
    }
  }

  return schemas;
}

/**
 * Get a single page schema.
 * Reads from JSON if it exists, otherwise parses the .astro file.
 */
export async function getPageSchema(
  slug: string,
  page: string,
): Promise<PageSchema | null> {
  // Try reading the schema JSON first
  const schemaPath = getSchemaPath(slug, page);
  try {
    const content = await fs.readFile(schemaPath, 'utf-8');
    return JSON.parse(content) as PageSchema;
  } catch {
    // Schema file doesn't exist — try parsing the .astro file
  }

  // Fall back to parsing the .astro file
  const astroPath = getAstroPath(slug, page);
  try {
    const source = await fs.readFile(astroPath, 'utf-8');
    const schema = parseAstroToSchema(source, page);

    // Cache the parsed schema for future reads
    try {
      const schemasDir = getSchemasDir(slug);
      await fs.mkdir(schemasDir, { recursive: true });
      await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2), 'utf-8');
    } catch {
      // Non-critical — schema will be re-parsed next time
    }

    return schema;
  } catch {
    return null;
  }
}

/**
 * Save a page schema.
 * Writes the JSON schema file AND compiles it to an .astro file.
 */
export async function savePageSchema(
  slug: string,
  schema: PageSchema,
): Promise<void> {
  // Ensure schemas directory exists
  const schemasDir = getSchemasDir(slug);
  await fs.mkdir(schemasDir, { recursive: true });

  // Write schema JSON
  const schemaPath = getSchemaPath(slug, schema.page);
  await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2), 'utf-8');

  // Compile and write .astro file
  const astroContent = compilePageSchema(schema);
  const astroPath = getAstroPath(slug, schema.page);
  await fs.writeFile(astroPath, astroContent, 'utf-8');
}

/**
 * Add a section to a page at the specified position.
 * Returns the updated PageSchema.
 */
export async function addSection(
  slug: string,
  page: string,
  section: SectionSchema,
  position?: number,
): Promise<PageSchema> {
  const schema = await getPageSchema(slug, page);
  if (!schema) {
    throw new Error(`Page "${page}" not found in site "${slug}"`);
  }

  if (position !== undefined && position >= 0 && position <= schema.sections.length) {
    schema.sections.splice(position, 0, section);
  } else {
    schema.sections.push(section);
  }

  await savePageSchema(slug, schema);
  return schema;
}

/**
 * Remove a section from a page by its id.
 * Returns the updated PageSchema.
 */
export async function removeSection(
  slug: string,
  page: string,
  sectionId: string,
): Promise<PageSchema> {
  const schema = await getPageSchema(slug, page);
  if (!schema) {
    throw new Error(`Page "${page}" not found in site "${slug}"`);
  }

  const index = schema.sections.findIndex((s) => s.id === sectionId);
  if (index === -1) {
    throw new Error(`Section "${sectionId}" not found on page "${page}"`);
  }

  schema.sections.splice(index, 1);
  await savePageSchema(slug, schema);
  return schema;
}

/**
 * Reorder sections on a page.
 * The sectionIds array must contain all section IDs in the desired order.
 * Returns the updated PageSchema.
 */
export async function reorderSections(
  slug: string,
  page: string,
  sectionIds: string[],
): Promise<PageSchema> {
  const schema = await getPageSchema(slug, page);
  if (!schema) {
    throw new Error(`Page "${page}" not found in site "${slug}"`);
  }

  // Validate that all IDs are present
  const existingIds = new Set(schema.sections.map((s) => s.id));
  const requestedIds = new Set(sectionIds);

  for (const id of sectionIds) {
    if (!existingIds.has(id)) {
      throw new Error(`Section "${id}" not found on page "${page}"`);
    }
  }
  for (const id of existingIds) {
    if (!requestedIds.has(id)) {
      throw new Error(`Missing section "${id}" in reorder request`);
    }
  }

  // Build a map for O(1) lookup
  const sectionMap = new Map(schema.sections.map((s) => [s.id, s]));
  schema.sections = sectionIds.map((id) => sectionMap.get(id)!);

  await savePageSchema(slug, schema);
  return schema;
}
