import { describe, it, expect } from 'vitest';
import { compilePageSchema } from '../../packages/utils/src/schema-compiler';
import type { PageSchema } from '../../packages/config/src/page-schema';

describe('compilePageSchema', () => {
  it('generates a valid Astro file for a simple page', () => {
    const schema: PageSchema = {
      page: 'index',
      title: 'Home',
      layout: 'FullWidth',
      seo: { title: 'Home', description: 'Welcome to our site' },
      sections: [
        {
          id: 'hero-1',
          component: 'Hero',
          variant: 'centered',
          props: { heading: 'Welcome' },
        },
      ],
    };

    const result = compilePageSchema(schema);

    // Check frontmatter delimiters
    expect(result).toMatch(/^---\n/);
    expect(result).toContain('---\n\n');

    // Check imports
    expect(result).toContain('import "../styles/global.css";');
    expect(result).toContain("import FullWidth from '@agency/ui/layouts/FullWidth.astro';");
    expect(result).toContain("import Hero from '@agency/ui/components/Hero.astro';");
    expect(result).toContain("import config from '../../site.config';");

    // Check title/description constants
    expect(result).toContain('const title = "Home";');
    expect(result).toContain('const description = "Welcome to our site";');

    // Check layout wrapper
    expect(result).toContain('<FullWidth title={title} description={description} config={config}>');
    expect(result).toContain('</FullWidth>');

    // Check component rendering
    expect(result).toContain('<Hero variant="centered" heading="Welcome" />');
  });

  it('wraps sections in Section component when heading is present', () => {
    const schema: PageSchema = {
      page: 'about',
      title: 'About',
      layout: 'SingleColumn',
      seo: {},
      sections: [
        {
          id: 'features-1',
          component: 'Features',
          variant: 'grid',
          props: {
            features: [
              { title: 'Fast', description: 'Lightning fast' },
            ],
          },
          heading: 'Our Features',
          subheading: 'What makes us different',
          background: 'light',
        },
      ],
    };

    const result = compilePageSchema(schema);

    // Should import Section
    expect(result).toContain("import Section from '@agency/ui/components/Section.astro';");

    // Should wrap in Section with bridge attributes
    expect(result).toContain('data-section-id="features-1"');
    expect(result).toContain('heading="Our Features"');
    expect(result).toContain('subheading="What makes us different"');
    expect(result).toContain('background="light"');
    expect(result).toContain('</Section>');

    // Inner component should be indented more
    expect(result).toContain('Features');
  });

  it('does not import Section when no sections need wrapping', () => {
    const schema: PageSchema = {
      page: 'simple',
      title: 'Simple',
      layout: 'FullWidth',
      seo: {},
      sections: [
        {
          id: 'hero-1',
          component: 'Hero',
          variant: 'minimal',
          props: { heading: 'Hello' },
        },
      ],
    };

    const result = compilePageSchema(schema);
    expect(result).not.toContain("import Section from");
  });

  it('handles React islands with client directives', () => {
    const schema: PageSchema = {
      page: 'contact',
      title: 'Contact',
      layout: 'SingleColumn',
      seo: {},
      sections: [
        {
          id: 'form-1',
          component: 'ContactForm',
          isIsland: true,
          clientDirective: 'idle',
          props: { endpoint: '/api/contact' },
        },
      ],
    };

    const result = compilePageSchema(schema);

    // Should import from islands, not components
    expect(result).toContain("import ContactForm from '@agency/ui/islands/ContactForm';");

    // Should have client directive
    expect(result).toContain('client:idle');
  });

  it('defaults island client directive to client:visible', () => {
    const schema: PageSchema = {
      page: 'contact',
      title: 'Contact',
      layout: 'SingleColumn',
      seo: {},
      sections: [
        {
          id: 'form-1',
          component: 'ContactForm',
          props: {},
        },
      ],
    };

    const result = compilePageSchema(schema);
    // ContactForm is in ISLAND_COMPONENTS, so it should get client:visible by default
    expect(result).toContain('client:visible');
  });

  it('handles multiple sections with correct ordering', () => {
    const schema: PageSchema = {
      page: 'index',
      title: 'Home',
      layout: 'FullWidth',
      seo: {},
      sections: [
        { id: 'hero-1', component: 'Hero', variant: 'split', props: { heading: 'First' } },
        { id: 'cta-1', component: 'CTA', variant: 'default', props: { heading: 'Second' } },
      ],
    };

    const result = compilePageSchema(schema);

    // Both components should be imported
    expect(result).toContain("import CTA from");
    expect(result).toContain("import Hero from");

    // Hero should appear before CTA in the template
    const heroIdx = result.indexOf('<Hero');
    const ctaIdx = result.indexOf('<CTA');
    expect(heroIdx).toBeLessThan(ctaIdx);
  });

  it('handles empty sections array', () => {
    const schema: PageSchema = {
      page: 'empty',
      title: 'Empty',
      layout: 'FullWidth',
      seo: {},
      sections: [],
    };

    const result = compilePageSchema(schema);

    // Should still have valid structure
    expect(result).toContain('---');
    expect(result).toContain('<FullWidth');
    expect(result).toContain('</FullWidth>');
  });

  it('handles config expression pass-through', () => {
    const schema: PageSchema = {
      page: 'index',
      title: '{config.seo.defaultTitle}',
      layout: 'FullWidth',
      seo: { title: '{config.seo.defaultTitle}', description: '{config.seo.defaultDescription}' },
      sections: [],
    };

    const result = compilePageSchema(schema);

    // Config expressions should be unwrapped (not quoted)
    expect(result).toContain('const title = config.seo.defaultTitle;');
    expect(result).toContain('const description = config.seo.defaultDescription;');
  });

  it('serializes object/array props correctly', () => {
    const schema: PageSchema = {
      page: 'index',
      title: 'Home',
      layout: 'FullWidth',
      seo: {},
      sections: [
        {
          id: 'cards-1',
          component: 'CardGrid',
          variant: 'three-column',
          props: {
            cards: [
              { title: 'Card 1', description: 'Desc 1' },
              { title: 'Card 2', description: 'Desc 2' },
            ],
          },
        },
      ],
    };

    const result = compilePageSchema(schema);

    // Array props should be rendered as JSON expression
    expect(result).toContain('cards={');
    expect(result).toContain('"Card 1"');
    expect(result).toContain('"Card 2"');
  });

  it('serializes boolean and number props correctly', () => {
    const schema: PageSchema = {
      page: 'test',
      title: 'Test',
      layout: 'FullWidth',
      seo: {},
      sections: [
        {
          id: 'test-1',
          component: 'Hero',
          props: {
            showButton: true,
            count: 42,
          },
        },
      ],
    };

    const result = compilePageSchema(schema);
    expect(result).toContain('showButton={true}');
    expect(result).toContain('count={42}');
  });

  it('generates CMS data-fetching for pages with cmsCollections', () => {
    const schema: PageSchema = {
      page: 'blog',
      title: 'Blog',
      layout: 'FullWidth',
      seo: {},
      sections: [],
      cmsCollections: ['posts'],
    };

    const result = compilePageSchema(schema);

    // Should import directus helpers
    expect(result).toContain("import { getPosts } from '../lib/directus';");
    expect(result).toContain("import { getDirectusImageUrl } from '@agency/utils';");

    // Should have await call
    expect(result).toContain('const rawPosts = await getPosts();');

    // Should have TODO comment
    expect(result).toContain('// TODO: map raw CMS data to component props');
  });

  it('uses multi-line formatting for components with many props', () => {
    const schema: PageSchema = {
      page: 'test',
      title: 'Test',
      layout: 'FullWidth',
      seo: {},
      sections: [
        {
          id: 'hero-1',
          component: 'Hero',
          variant: 'split',
          props: {
            heading: 'Hello',
            subheading: 'World',
            buttonText: 'Click',
          },
        },
      ],
    };

    const result = compilePageSchema(schema);

    // With variant + 3 props (4 attrs total), should use multi-line format
    // Each attr should be on its own line
    const heroBlock = result.substring(result.indexOf('<Hero'), result.indexOf('/>') + 2);
    const lines = heroBlock.split('\n');
    expect(lines.length).toBeGreaterThan(1);
  });

  it('handles sectionId attribute', () => {
    const schema: PageSchema = {
      page: 'test',
      title: 'Test',
      layout: 'FullWidth',
      seo: {},
      sections: [
        {
          id: 'hero-1',
          component: 'Hero',
          props: { heading: 'Test' },
          sectionId: 'hero-section',
        },
      ],
    };

    const result = compilePageSchema(schema);
    expect(result).toContain('id="hero-section"');
  });
});
