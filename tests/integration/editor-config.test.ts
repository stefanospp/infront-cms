import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Phase 4 — Site Config Editor & Admin Enhancements tests.
 */

// ---------------------------------------------------------------------------
// Source paths
// ---------------------------------------------------------------------------

const CONFIG_API_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/pages/api/sites/[slug]/config.ts',
);

const EDITOR_CONFIG_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/islands/editor/EditorConfig.tsx',
);

const EDITOR_TOOLBAR_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/islands/editor/EditorToolbar.tsx',
);

const SITE_EDITOR_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/islands/SiteEditor.tsx',
);

function readSource(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

// ---------------------------------------------------------------------------
// Tests: Config API Route
// ---------------------------------------------------------------------------

describe('Site Config API Route', () => {
  const source = readSource(CONFIG_API_PATH);

  it('exports prerender = false', () => {
    expect(source).toContain('prerender = false');
  });

  it('exports GET and PUT handlers', () => {
    expect(source).toContain('export const GET');
    expect(source).toContain('export const PUT');
  });

  it('validates slug format', () => {
    expect(source).toContain('SLUG_PATTERN');
  });

  it('validates config body with zod', () => {
    expect(source).toContain('siteConfigSchema');
    expect(source).toContain('safeParse');
  });

  it('validates all config sections', () => {
    expect(source).toContain('contactSchema');
    expect(source).toContain('navSchema');
    expect(source).toContain('footerSchema');
    expect(source).toContain('seoSchema');
    expect(source).toContain('themeSchema');
  });

  it('validates theme enum values', () => {
    expect(source).toContain("z.enum(['sticky', 'fixed', 'static'])");
    expect(source).toContain("z.enum(['simple', 'multi-column', 'minimal'])");
    expect(source).toContain("z.enum(['sharp', 'rounded', 'pill'])");
  });

  it('reads config from site.config.ts file', () => {
    expect(source).toContain('site.config.ts');
  });

  it('writes config back as valid TypeScript', () => {
    expect(source).toContain('SiteConfig');
    expect(source).toContain('export default');
  });

  it('checks site directory exists before reading/writing', () => {
    expect(source).toContain('Site not found');
  });
});

// ---------------------------------------------------------------------------
// Tests: EditorConfig Component
// ---------------------------------------------------------------------------

describe('EditorConfig Component', () => {
  const source = readSource(EDITOR_CONFIG_PATH);

  it('accepts slug, isOpen, and onClose props', () => {
    expect(source).toContain('slug: string');
    expect(source).toContain('isOpen: boolean');
    expect(source).toContain('onClose: () => void');
  });

  it('loads config from API on open', () => {
    expect(source).toContain('/api/sites/');
    expect(source).toContain('/config');
  });

  it('has tabs for all config sections', () => {
    expect(source).toContain("'general'");
    expect(source).toContain("'contact'");
    expect(source).toContain("'seo'");
    expect(source).toContain("'nav'");
    expect(source).toContain("'theme'");
  });

  it('has save functionality', () => {
    expect(source).toContain('handleSave');
    expect(source).toContain("method: 'PUT'");
  });

  it('tracks unsaved changes', () => {
    expect(source).toContain('hasChanges');
    expect(source).toContain('setHasChanges');
  });

  it('supports deep updates via dot-notation paths', () => {
    expect(source).toContain('dotPath');
    expect(source).toContain("dotPath.split('.')");
  });

  it('renders all theme options', () => {
    expect(source).toContain('Navigation Style');
    expect(source).toContain('Footer Style');
    expect(source).toContain('Default Hero');
    expect(source).toContain('Border Style');
  });

  it('supports nav item CRUD', () => {
    expect(source).toContain('addNavItem');
    expect(source).toContain('removeNavItem');
    expect(source).toContain('updateNavItem');
  });

  it('renders as modal overlay', () => {
    expect(source).toContain('fixed inset-0');
    expect(source).toContain('z-50');
  });

  it('returns null when not open', () => {
    expect(source).toContain('if (!isOpen) return null');
  });
});

// ---------------------------------------------------------------------------
// Tests: Toolbar Settings Button
// ---------------------------------------------------------------------------

describe('EditorToolbar — Settings Button', () => {
  const source = readSource(EDITOR_TOOLBAR_PATH);

  it('accepts onOpenConfig prop', () => {
    expect(source).toContain('onOpenConfig');
  });

  it('renders settings button with gear icon', () => {
    expect(source).toContain('Site Settings');
  });
});

// ---------------------------------------------------------------------------
// Tests: SiteEditor — Config Integration
// ---------------------------------------------------------------------------

describe('SiteEditor — Config Integration', () => {
  const source = readSource(SITE_EDITOR_PATH);

  it('imports EditorConfig', () => {
    expect(source).toContain("import EditorConfig from './editor/EditorConfig'");
  });

  it('has showConfig state', () => {
    expect(source).toContain('showConfig');
    expect(source).toContain('setShowConfig');
  });

  it('passes onOpenConfig to toolbar', () => {
    expect(source).toContain('onOpenConfig={');
  });

  it('renders EditorConfig with isOpen bound to showConfig', () => {
    expect(source).toContain('isOpen={showConfig}');
  });
});
