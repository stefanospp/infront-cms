import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Phase 4 (continued) — Media Library, Setup Checklist tests.
 */

// ---------------------------------------------------------------------------
// Source paths
// ---------------------------------------------------------------------------

const MEDIA_API_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/pages/api/sites/[slug]/media.ts',
);

const CHECKLIST_API_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/pages/api/sites/[slug]/checklist.ts',
);

const MEDIA_LIBRARY_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/islands/editor/MediaLibrary.tsx',
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
// Tests: Media API Route
// ---------------------------------------------------------------------------

describe('Media API Route', () => {
  const source = readSource(MEDIA_API_PATH);

  it('exports prerender = false', () => {
    expect(source).toContain('prerender = false');
  });

  it('exports GET, POST, and DELETE handlers', () => {
    expect(source).toContain('export const GET');
    expect(source).toContain('export const POST');
    expect(source).toContain('export const DELETE');
  });

  it('validates slug format', () => {
    expect(source).toContain('SLUG_PATTERN');
  });

  it('restricts allowed file extensions', () => {
    expect(source).toContain('ALLOWED_EXTENSIONS');
    expect(source).toContain('.jpg');
    expect(source).toContain('.png');
    expect(source).toContain('.webp');
    expect(source).toContain('.svg');
  });

  it('enforces max file size', () => {
    expect(source).toContain('MAX_FILE_SIZE');
    expect(source).toContain('File too large');
  });

  it('sanitizes uploaded filenames', () => {
    expect(source).toContain('toLowerCase');
    expect(source).toContain("replace(/\\s+/g, '-')");
  });

  it('prevents filename collisions with timestamp', () => {
    expect(source).toContain('Date.now()');
  });

  it('prevents path traversal on upload', () => {
    expect(source).toContain('startsWith(mediaDir');
  });

  it('prevents path traversal on delete', () => {
    expect(source).toContain('path.basename');
  });

  it('handles multipart/form-data for uploads', () => {
    expect(source).toContain('multipart/form-data');
    expect(source).toContain('formData');
  });

  it('stores images in public/images/', () => {
    expect(source).toContain("'public', 'images'");
  });

  it('returns images sorted by modification time', () => {
    expect(source).toContain('.sort(');
    expect(source).toContain('modified');
  });
});

// ---------------------------------------------------------------------------
// Tests: Checklist API Route
// ---------------------------------------------------------------------------

describe('Checklist API Route', () => {
  const source = readSource(CHECKLIST_API_PATH);

  it('exports prerender = false', () => {
    expect(source).toContain('prerender = false');
  });

  it('exports GET handler', () => {
    expect(source).toContain('export const GET');
  });

  it('checks site config exists', () => {
    expect(source).toContain('site.config.ts');
  });

  it('checks theme/CSS exists', () => {
    expect(source).toContain('global.css');
  });

  it('checks favicon customization', () => {
    expect(source).toContain('favicon');
  });

  it('checks page count', () => {
    expect(source).toContain('pageCount');
  });

  it('checks image uploads', () => {
    expect(source).toContain('hasImages');
  });

  it('checks OG image', () => {
    expect(source).toContain('og-default');
  });

  it('checks deployment status', () => {
    expect(source).toContain('.deploy.json');
    expect(source).toContain('hasDeployed');
  });

  it('checks custom domain', () => {
    expect(source).toContain('hasCustomDomain');
    expect(source).toContain('productionUrl');
  });

  it('checks security headers', () => {
    expect(source).toContain('_headers');
  });

  it('categorizes items into setup, content, and deploy', () => {
    expect(source).toContain("'setup'");
    expect(source).toContain("'content'");
    expect(source).toContain("'deploy'");
  });

  it('returns completion stats', () => {
    expect(source).toContain('completed');
    expect(source).toContain('total');
  });
});

// ---------------------------------------------------------------------------
// Tests: MediaLibrary Component
// ---------------------------------------------------------------------------

describe('MediaLibrary Component', () => {
  const source = readSource(MEDIA_LIBRARY_PATH);

  it('accepts slug, isOpen, onClose, and optional onSelect', () => {
    expect(source).toContain('slug: string');
    expect(source).toContain('isOpen: boolean');
    expect(source).toContain('onClose: () => void');
    expect(source).toContain('onSelect');
  });

  it('loads images from API', () => {
    expect(source).toContain('/api/sites/');
    expect(source).toContain('/media');
  });

  it('supports file upload', () => {
    expect(source).toContain('handleUpload');
    expect(source).toContain("type=\"file\"");
    expect(source).toContain("accept=\"image/*\"");
  });

  it('supports image deletion', () => {
    expect(source).toContain('handleDelete');
    expect(source).toContain("method: 'DELETE'");
  });

  it('supports image selection (picker mode)', () => {
    expect(source).toContain('handleSelectAndClose');
    expect(source).toContain('selectedImage');
  });

  it('displays file size', () => {
    expect(source).toContain('formatFileSize');
  });

  it('renders as modal overlay', () => {
    expect(source).toContain('fixed inset-0');
    expect(source).toContain('z-50');
  });

  it('returns null when not open', () => {
    expect(source).toContain('if (!isOpen) return null');
  });

  it('shows empty state when no images', () => {
    expect(source).toContain('No images yet');
  });

  it('displays images in a grid', () => {
    expect(source).toContain('grid-cols-4');
  });
});

// ---------------------------------------------------------------------------
// Tests: Toolbar and Editor Integration
// ---------------------------------------------------------------------------

describe('EditorToolbar — Media Button', () => {
  const source = readSource(EDITOR_TOOLBAR_PATH);

  it('accepts onOpenMedia prop', () => {
    expect(source).toContain('onOpenMedia');
  });

  it('renders media button with image icon', () => {
    expect(source).toContain('Media Library');
  });
});

describe('SiteEditor — Media Integration', () => {
  const source = readSource(SITE_EDITOR_PATH);

  it('imports MediaLibrary', () => {
    expect(source).toContain("import MediaLibrary from './editor/MediaLibrary'");
  });

  it('has showMedia state', () => {
    expect(source).toContain('showMedia');
    expect(source).toContain('setShowMedia');
  });

  it('passes onOpenMedia to toolbar', () => {
    expect(source).toContain('onOpenMedia={');
  });

  it('renders MediaLibrary with isOpen bound to showMedia', () => {
    expect(source).toContain('isOpen={showMedia}');
  });
});
