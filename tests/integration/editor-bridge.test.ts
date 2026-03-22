import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PageSchema, SectionSchema } from '../../packages/config/src/page-schema';
import { compilePageSchema } from '../../packages/utils/src/schema-compiler';

/**
 * Phase 3 — Editor Bridge & Inline Editing tests.
 *
 * Tests the editor bridge Vite plugin, data-section-id attributes in
 * compiled output, and the preview-editor communication contract.
 */

// ---------------------------------------------------------------------------
// Source paths
// ---------------------------------------------------------------------------

const BRIDGE_PLUGIN_PATH = path.resolve(
  __dirname,
  '../../packages/utils/src/vite-editor-bridge.ts',
);

const EDITOR_PREVIEW_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/islands/editor/EditorPreview.tsx',
);

const SITE_EDITOR_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/islands/SiteEditor.tsx',
);

const GENERATOR_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/lib/generator.ts',
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readSource(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

function makeSection(overrides: Partial<SectionSchema> = {}): SectionSchema {
  return {
    id: 'hero-1',
    component: 'Hero',
    variant: 'centered',
    props: { heading: 'Welcome' },
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
// Tests: Schema compiler generates data-section-id attributes
// ---------------------------------------------------------------------------

describe('Schema Compiler — Editor Bridge Attributes', () => {
  it('adds data-section-id to unwrapped sections', () => {
    const schema = makePageSchema({
      sections: [makeSection({ id: 'hero-1', component: 'Hero' })],
    });

    const output = compilePageSchema(schema);
    expect(output).toContain('data-section-id="hero-1"');
    expect(output).toContain('data-component="Hero"');
  });

  it('adds data-section-id to Section-wrapped sections', () => {
    const schema = makePageSchema({
      sections: [
        makeSection({
          id: 'features-1',
          component: 'Features',
          heading: 'Our Features',
          background: 'light',
        }),
      ],
    });

    const output = compilePageSchema(schema);
    expect(output).toContain('data-section-id="features-1"');
    expect(output).toContain('data-component="Features"');
    expect(output).toContain('<Section');
  });

  it('generates unique data-section-id per section', () => {
    const schema = makePageSchema({
      sections: [
        makeSection({ id: 'hero-1', component: 'Hero' }),
        makeSection({ id: 'cta-1', component: 'CTA' }),
        makeSection({ id: 'faq-1', component: 'FAQ' }),
      ],
    });

    const output = compilePageSchema(schema);
    expect(output).toContain('data-section-id="hero-1"');
    expect(output).toContain('data-section-id="cta-1"');
    expect(output).toContain('data-section-id="faq-1"');
  });

  it('wraps unwrapped sections in a div with bridge attributes', () => {
    const schema = makePageSchema({
      sections: [makeSection({ id: 'hero-1', component: 'Hero' })],
    });

    const output = compilePageSchema(schema);
    // Unwrapped sections should be in a <div> with bridge attrs
    expect(output).toContain('<div data-section-id="hero-1" data-component="Hero">');
  });

  it('puts bridge attributes on Section wrapper when wrapped', () => {
    const schema = makePageSchema({
      sections: [
        makeSection({
          id: 'team-1',
          component: 'TeamGrid',
          heading: 'Our Team',
        }),
      ],
    });

    const output = compilePageSchema(schema);
    // Bridge attrs should be on the <Section> element
    expect(output).toContain('<Section data-section-id="team-1" data-component="TeamGrid"');
  });
});

// ---------------------------------------------------------------------------
// Tests: Editor Bridge Plugin
// ---------------------------------------------------------------------------

describe('Editor Bridge Plugin', () => {
  const bridgeSource = readSource(BRIDGE_PLUGIN_PATH);

  it('exists and exports editorBridgePlugin function', () => {
    expect(bridgeSource).toContain('export function editorBridgePlugin');
  });

  it('returns a Vite plugin with correct name', () => {
    expect(bridgeSource).toContain("name: 'agency-editor-bridge'");
  });

  it('injects script via transformIndexHtml hook', () => {
    expect(bridgeSource).toContain('transformIndexHtml');
  });

  it('bridge script only runs inside iframes', () => {
    expect(bridgeSource).toContain('window === window.parent');
  });

  it('bridge script handles postMessage communication', () => {
    // Bridge sends messages to parent
    expect(bridgeSource).toContain('window.parent.postMessage');
    // Bridge listens for messages from parent
    expect(bridgeSource).toContain("window.addEventListener('message'");
  });

  it('bridge script sends section-select on click', () => {
    expect(bridgeSource).toContain('editor-bridge:section-select');
  });

  it('bridge script sends prop-update on inline edit', () => {
    expect(bridgeSource).toContain('editor-bridge:prop-update');
  });

  it('bridge script listens for highlight-section from editor', () => {
    expect(bridgeSource).toContain('editor-bridge:highlight-section');
  });

  it('bridge script sends ready event on initialization', () => {
    expect(bridgeSource).toContain('editor-bridge:ready');
  });

  it('bridge script supports inline text editing via contenteditable', () => {
    expect(bridgeSource).toContain('contenteditable');
    expect(bridgeSource).toContain('dblclick');
  });

  it('bridge script handles Escape to cancel editing', () => {
    expect(bridgeSource).toContain('Escape');
  });

  it('bridge script handles Enter to confirm editing', () => {
    expect(bridgeSource).toContain("e.key === 'Enter'");
  });
});

// ---------------------------------------------------------------------------
// Tests: EditorPreview handles bridge messages
// ---------------------------------------------------------------------------

describe('EditorPreview — Bridge Integration', () => {
  const previewSource = readSource(EDITOR_PREVIEW_PATH);

  it('accepts onSectionSelect callback prop', () => {
    expect(previewSource).toContain('onSectionSelect');
  });

  it('accepts onPropUpdate callback prop', () => {
    expect(previewSource).toContain('onPropUpdate');
  });

  it('accepts selectedSectionId prop', () => {
    expect(previewSource).toContain('selectedSectionId');
  });

  it('listens for postMessage events', () => {
    expect(previewSource).toContain("addEventListener('message'");
  });

  it('handles editor-bridge:ready message', () => {
    expect(previewSource).toContain('editor-bridge:ready');
  });

  it('handles editor-bridge:section-select message', () => {
    expect(previewSource).toContain('editor-bridge:section-select');
  });

  it('handles editor-bridge:prop-update message', () => {
    expect(previewSource).toContain('editor-bridge:prop-update');
  });

  it('sends highlight-section to iframe on selectedSectionId change', () => {
    expect(previewSource).toContain('editor-bridge:highlight-section');
    expect(previewSource).toContain('postMessage');
  });

  it('tracks bridge ready state', () => {
    expect(previewSource).toContain('bridgeReady');
    expect(previewSource).toContain('setBridgeReady');
  });
});

// ---------------------------------------------------------------------------
// Tests: SiteEditor wires up bridge callbacks
// ---------------------------------------------------------------------------

describe('SiteEditor — Bridge Wiring', () => {
  const editorSource = readSource(SITE_EDITOR_PATH);

  it('passes onSectionSelect to EditorPreview', () => {
    expect(editorSource).toContain('onSectionSelect={handlePreviewSectionSelect}');
  });

  it('passes onPropUpdate to EditorPreview', () => {
    expect(editorSource).toContain('onPropUpdate={handlePreviewPropUpdate}');
  });

  it('passes selectedSectionId to EditorPreview', () => {
    expect(editorSource).toContain('selectedSectionId={selectedSectionId}');
  });

  it('has handlePreviewSectionSelect handler', () => {
    expect(editorSource).toContain('function handlePreviewSectionSelect');
  });

  it('has handlePreviewPropUpdate handler that updates section props', () => {
    expect(editorSource).toContain('function handlePreviewPropUpdate');
    expect(editorSource).toContain('propPath');
  });
});

// ---------------------------------------------------------------------------
// Tests: Generator includes editorBridgePlugin
// ---------------------------------------------------------------------------

describe('Generator — Editor Bridge Plugin Registration', () => {
  const generatorSource = readSource(GENERATOR_PATH);

  it('imports editorBridgePlugin', () => {
    expect(generatorSource).toContain('editorBridgePlugin');
  });

  it('includes editorBridgePlugin in vite plugins array', () => {
    expect(generatorSource).toContain('editorBridgePlugin()');
  });
});
