import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import type { PageSchema, SectionSchema } from '../../packages/config/src/page-schema';

/**
 * Phase 2 — Page Schema Operations tests.
 *
 * Since page-schemas.ts depends on admin-specific imports (@/lib/generator),
 * we test the core logic by inlining the same operations against a temp directory.
 */

// Inline the schema compiler/parser since they are pure functions
import { compilePageSchema } from '../../packages/utils/src/schema-compiler';
import { parseAstroToSchema } from '../../packages/utils/src/schema-parser';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeSection(overrides: Partial<SectionSchema> = {}): SectionSchema {
  return {
    id: 'hero-1',
    component: 'Hero',
    variant: 'centered',
    props: { heading: 'Welcome', subheading: 'Hello World' },
    ...overrides,
  };
}

function makePageSchema(overrides: Partial<PageSchema> = {}): PageSchema {
  return {
    page: 'index',
    title: 'Home',
    layout: 'FullWidth',
    seo: { title: 'Home', description: 'Home page' },
    sections: [makeSection()],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helper: simulate page-schemas.ts operations without admin imports
// ---------------------------------------------------------------------------

let tmpDir: string;

async function setupTempSite(slug: string) {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'phase2-test-'));
  const pagesDir = path.join(tmpDir, 'sites', slug, 'src', 'pages');
  const schemasDir = path.join(tmpDir, 'sites', slug, 'src', 'schemas');
  await fs.mkdir(pagesDir, { recursive: true });
  await fs.mkdir(schemasDir, { recursive: true });
  return { pagesDir, schemasDir };
}

async function cleanupTempSite() {
  if (tmpDir) {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

// Simulate savePageSchema
async function savePageSchema(
  pagesDir: string,
  schemasDir: string,
  schema: PageSchema,
) {
  const schemaPath = path.join(schemasDir, `${schema.page}.json`);
  await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2), 'utf-8');

  const astroContent = compilePageSchema(schema);
  const astroPath = path.join(pagesDir, `${schema.page}.astro`);
  await fs.writeFile(astroPath, astroContent, 'utf-8');
}

// Simulate getPageSchema
async function getPageSchema(
  pagesDir: string,
  schemasDir: string,
  page: string,
): Promise<PageSchema | null> {
  const schemaPath = path.join(schemasDir, `${page}.json`);
  try {
    const content = await fs.readFile(schemaPath, 'utf-8');
    return JSON.parse(content) as PageSchema;
  } catch {
    // Fall back to parsing .astro
  }

  const astroPath = path.join(pagesDir, `${page}.astro`);
  try {
    const source = await fs.readFile(astroPath, 'utf-8');
    return parseAstroToSchema(source, page);
  } catch {
    return null;
  }
}

// Simulate addSection
async function addSection(
  pagesDir: string,
  schemasDir: string,
  page: string,
  section: SectionSchema,
  position?: number,
): Promise<PageSchema> {
  const schema = await getPageSchema(pagesDir, schemasDir, page);
  if (!schema) throw new Error(`Page "${page}" not found`);

  if (position !== undefined && position >= 0 && position <= schema.sections.length) {
    schema.sections.splice(position, 0, section);
  } else {
    schema.sections.push(section);
  }

  await savePageSchema(pagesDir, schemasDir, schema);
  return schema;
}

// Simulate removeSection
async function removeSection(
  pagesDir: string,
  schemasDir: string,
  page: string,
  sectionId: string,
): Promise<PageSchema> {
  const schema = await getPageSchema(pagesDir, schemasDir, page);
  if (!schema) throw new Error(`Page "${page}" not found`);

  const index = schema.sections.findIndex((s) => s.id === sectionId);
  if (index === -1) throw new Error(`Section "${sectionId}" not found`);

  schema.sections.splice(index, 1);
  await savePageSchema(pagesDir, schemasDir, schema);
  return schema;
}

// Simulate reorderSections
async function reorderSections(
  pagesDir: string,
  schemasDir: string,
  page: string,
  sectionIds: string[],
): Promise<PageSchema> {
  const schema = await getPageSchema(pagesDir, schemasDir, page);
  if (!schema) throw new Error(`Page "${page}" not found`);

  const existingIds = new Set(schema.sections.map((s) => s.id));
  const requestedIds = new Set(sectionIds);

  for (const id of sectionIds) {
    if (!existingIds.has(id)) throw new Error(`Section "${id}" not found`);
  }
  for (const id of existingIds) {
    if (!requestedIds.has(id)) throw new Error(`Missing section "${id}"`);
  }

  const sectionMap = new Map(schema.sections.map((s) => [s.id, s]));
  schema.sections = sectionIds.map((id) => sectionMap.get(id)!);

  await savePageSchema(pagesDir, schemasDir, schema);
  return schema;
}

// ---------------------------------------------------------------------------
// shouldExcludePage logic
// ---------------------------------------------------------------------------

function shouldExcludePage(filename: string): boolean {
  if (filename.startsWith('[...')) return true;
  if (filename.startsWith('_')) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Page Schema Operations (Phase 2)', () => {
  let pagesDir: string;
  let schemasDir: string;

  beforeEach(async () => {
    const dirs = await setupTempSite('test-site');
    pagesDir = dirs.pagesDir;
    schemasDir = dirs.schemasDir;
  });

  afterEach(async () => {
    await cleanupTempSite();
  });

  // ---- Save & Read ----

  describe('savePageSchema + getPageSchema', () => {
    it('saves schema JSON and compiles .astro file', async () => {
      const schema = makePageSchema();
      await savePageSchema(pagesDir, schemasDir, schema);

      // Schema JSON exists
      const jsonContent = await fs.readFile(
        path.join(schemasDir, 'index.json'),
        'utf-8',
      );
      const parsed = JSON.parse(jsonContent);
      expect(parsed.page).toBe('index');
      expect(parsed.sections).toHaveLength(1);

      // .astro file exists
      const astroContent = await fs.readFile(
        path.join(pagesDir, 'index.astro'),
        'utf-8',
      );
      expect(astroContent).toContain('Hero');
      expect(astroContent).toContain('FullWidth');
    });

    it('reads schema from JSON when available', async () => {
      const schema = makePageSchema();
      await savePageSchema(pagesDir, schemasDir, schema);

      const result = await getPageSchema(pagesDir, schemasDir, 'index');
      expect(result).not.toBeNull();
      expect(result!.page).toBe('index');
      expect(result!.title).toBe('Home');
      expect(result!.sections).toHaveLength(1);
      expect(result!.sections[0]!.component).toBe('Hero');
    });

    it('falls back to parsing .astro when no schema JSON exists', async () => {
      // Write only the .astro file
      const schema = makePageSchema();
      const astroContent = compilePageSchema(schema);
      await fs.writeFile(path.join(pagesDir, 'about.astro'), astroContent, 'utf-8');

      const result = await getPageSchema(pagesDir, schemasDir, 'about');
      expect(result).not.toBeNull();
      expect(result!.layout).toBeTruthy();
    });

    it('returns null for non-existent pages', async () => {
      const result = await getPageSchema(pagesDir, schemasDir, 'nonexistent');
      expect(result).toBeNull();
    });

    it('preserves section variants and props through save/read', async () => {
      const schema = makePageSchema({
        sections: [
          makeSection({ variant: 'split', props: { heading: 'Test', ctaText: 'Click me' } }),
        ],
      });
      await savePageSchema(pagesDir, schemasDir, schema);

      const result = await getPageSchema(pagesDir, schemasDir, 'index');
      expect(result!.sections[0]!.variant).toBe('split');
      expect(result!.sections[0]!.props.heading).toBe('Test');
      expect(result!.sections[0]!.props.ctaText).toBe('Click me');
    });

    it('handles multiple sections', async () => {
      const schema = makePageSchema({
        sections: [
          makeSection({ id: 'hero-1', component: 'Hero' }),
          makeSection({ id: 'cta-1', component: 'CTA', variant: 'split' }),
          makeSection({ id: 'faq-1', component: 'FAQ', variant: 'default' }),
        ],
      });
      await savePageSchema(pagesDir, schemasDir, schema);

      const result = await getPageSchema(pagesDir, schemasDir, 'index');
      expect(result!.sections).toHaveLength(3);
      expect(result!.sections.map((s) => s.component)).toEqual(['Hero', 'CTA', 'FAQ']);
    });
  });

  // ---- Section operations ----

  describe('addSection', () => {
    it('appends section to end by default', async () => {
      await savePageSchema(pagesDir, schemasDir, makePageSchema());

      const newSection = makeSection({ id: 'cta-1', component: 'CTA' });
      const result = await addSection(pagesDir, schemasDir, 'index', newSection);

      expect(result.sections).toHaveLength(2);
      expect(result.sections[1]!.id).toBe('cta-1');
    });

    it('inserts section at specified position', async () => {
      await savePageSchema(pagesDir, schemasDir, makePageSchema({
        sections: [
          makeSection({ id: 'hero-1' }),
          makeSection({ id: 'cta-1', component: 'CTA' }),
        ],
      }));

      const newSection = makeSection({ id: 'features-1', component: 'Features' });
      const result = await addSection(pagesDir, schemasDir, 'index', newSection, 1);

      expect(result.sections).toHaveLength(3);
      expect(result.sections[1]!.id).toBe('features-1');
      expect(result.sections[2]!.id).toBe('cta-1');
    });

    it('throws when page not found', async () => {
      const section = makeSection();
      await expect(
        addSection(pagesDir, schemasDir, 'nonexistent', section),
      ).rejects.toThrow('not found');
    });

    it('persists the addition (re-readable after save)', async () => {
      await savePageSchema(pagesDir, schemasDir, makePageSchema());

      const newSection = makeSection({ id: 'features-1', component: 'Features' });
      await addSection(pagesDir, schemasDir, 'index', newSection);

      const reloaded = await getPageSchema(pagesDir, schemasDir, 'index');
      expect(reloaded!.sections).toHaveLength(2);
    });
  });

  describe('removeSection', () => {
    it('removes section by id', async () => {
      await savePageSchema(pagesDir, schemasDir, makePageSchema({
        sections: [
          makeSection({ id: 'hero-1' }),
          makeSection({ id: 'cta-1', component: 'CTA' }),
        ],
      }));

      const result = await removeSection(pagesDir, schemasDir, 'index', 'hero-1');
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0]!.id).toBe('cta-1');
    });

    it('throws when section not found', async () => {
      await savePageSchema(pagesDir, schemasDir, makePageSchema());

      await expect(
        removeSection(pagesDir, schemasDir, 'index', 'nonexistent'),
      ).rejects.toThrow('not found');
    });

    it('throws when page not found', async () => {
      await expect(
        removeSection(pagesDir, schemasDir, 'nonexistent', 'hero-1'),
      ).rejects.toThrow('not found');
    });
  });

  describe('reorderSections', () => {
    it('reorders sections to match provided order', async () => {
      await savePageSchema(pagesDir, schemasDir, makePageSchema({
        sections: [
          makeSection({ id: 'hero-1' }),
          makeSection({ id: 'features-1', component: 'Features' }),
          makeSection({ id: 'cta-1', component: 'CTA' }),
        ],
      }));

      const result = await reorderSections(
        pagesDir, schemasDir, 'index',
        ['cta-1', 'hero-1', 'features-1'],
      );

      expect(result.sections.map((s) => s.id)).toEqual([
        'cta-1', 'hero-1', 'features-1',
      ]);
    });

    it('throws when a section ID is not found', async () => {
      await savePageSchema(pagesDir, schemasDir, makePageSchema());

      await expect(
        reorderSections(pagesDir, schemasDir, 'index', ['hero-1', 'nonexistent']),
      ).rejects.toThrow('not found');
    });

    it('throws when a section is missing from the reorder list', async () => {
      await savePageSchema(pagesDir, schemasDir, makePageSchema({
        sections: [
          makeSection({ id: 'hero-1' }),
          makeSection({ id: 'cta-1', component: 'CTA' }),
        ],
      }));

      await expect(
        reorderSections(pagesDir, schemasDir, 'index', ['hero-1']),
      ).rejects.toThrow('Missing section');
    });

    it('persists the reorder', async () => {
      await savePageSchema(pagesDir, schemasDir, makePageSchema({
        sections: [
          makeSection({ id: 'a', component: 'Hero' }),
          makeSection({ id: 'b', component: 'CTA' }),
        ],
      }));

      await reorderSections(pagesDir, schemasDir, 'index', ['b', 'a']);

      const reloaded = await getPageSchema(pagesDir, schemasDir, 'index');
      expect(reloaded!.sections.map((s) => s.id)).toEqual(['b', 'a']);
    });
  });

  // ---- Page exclusion filter ----

  describe('shouldExcludePage', () => {
    it('excludes catch-all routes', () => {
      expect(shouldExcludePage('[...slug].astro')).toBe(true);
    });

    it('excludes partial files starting with _', () => {
      expect(shouldExcludePage('_layout.astro')).toBe(true);
    });

    it('includes normal pages', () => {
      expect(shouldExcludePage('index.astro')).toBe(false);
      expect(shouldExcludePage('about.astro')).toBe(false);
      expect(shouldExcludePage('contact.astro')).toBe(false);
    });
  });
});
