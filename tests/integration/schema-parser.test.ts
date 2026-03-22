import { describe, it, expect } from 'vitest';
import { parseAstroToSchema } from '../../packages/utils/src/schema-parser';
import { compilePageSchema } from '../../packages/utils/src/schema-compiler';
import type { PageSchema } from '../../packages/config/src/page-schema';

describe('parseAstroToSchema', () => {
  it('extracts layout from imports', () => {
    const astro = `---
import FullWidth from '@agency/ui/layouts/FullWidth.astro';
import config from '../../site.config';

const title = "Home";
const description = "Welcome";
---

<FullWidth title={title} description={description} config={config}>
</FullWidth>
`;

    const schema = parseAstroToSchema(astro, 'index');
    expect(schema.layout).toBe('FullWidth');
  });

  it('extracts title and description', () => {
    const astro = `---
import FullWidth from '@agency/ui/layouts/FullWidth.astro';
import config from '../../site.config';

const title = "My Page Title";
const description = "My page description";
---

<FullWidth title={title} description={description} config={config}>
</FullWidth>
`;

    const schema = parseAstroToSchema(astro, 'test');
    expect(schema.title).toBe('My Page Title');
    expect(schema.seo.description).toBe('My page description');
  });

  it('extracts a simple component with variant and props', () => {
    const astro = `---
import FullWidth from '@agency/ui/layouts/FullWidth.astro';
import Hero from '@agency/ui/components/Hero.astro';
import config from '../../site.config';

const title = "Home";
const description = "";
---

<FullWidth title={title} description={description} config={config}>
  <Hero variant="centered" heading="Welcome" subheading="Hello world" />
</FullWidth>
`;

    const schema = parseAstroToSchema(astro, 'index');
    expect(schema.sections).toHaveLength(1);
    expect(schema.sections[0]!.component).toBe('Hero');
    expect(schema.sections[0]!.variant).toBe('centered');
    expect(schema.sections[0]!.props.heading).toBe('Welcome');
    expect(schema.sections[0]!.props.subheading).toBe('Hello world');
  });

  it('extracts Section-wrapped components', () => {
    const astro = `---
import FullWidth from '@agency/ui/layouts/FullWidth.astro';
import Section from '@agency/ui/components/Section.astro';
import Features from '@agency/ui/components/Features.astro';
import config from '../../site.config';

const title = "Home";
const description = "";
---

<FullWidth title={title} description={description} config={config}>
  <Section heading="Our Features" background="light">
    <Features variant="grid" />
  </Section>
</FullWidth>
`;

    const schema = parseAstroToSchema(astro, 'index');
    expect(schema.sections).toHaveLength(1);
    const section = schema.sections[0]!;
    expect(section.component).toBe('Features');
    expect(section.variant).toBe('grid');
    expect(section.heading).toBe('Our Features');
    expect(section.background).toBe('light');
  });

  it('detects CMS collections from directus imports', () => {
    const astro = `---
import FullWidth from '@agency/ui/layouts/FullWidth.astro';
import config from '../../site.config';
import { getPosts, getTeamMembers } from '../lib/directus';

const title = "Blog";
const description = "";
---

<FullWidth title={title} description={description} config={config}>
</FullWidth>
`;

    const schema = parseAstroToSchema(astro, 'blog');
    expect(schema.cmsCollections).toBeDefined();
    expect(schema.cmsCollections).toContain('posts');
    expect(schema.cmsCollections).toContain('teamMembers');
  });

  it('handles multiple sections in order', () => {
    const astro = `---
import FullWidth from '@agency/ui/layouts/FullWidth.astro';
import Hero from '@agency/ui/components/Hero.astro';
import CTA from '@agency/ui/components/CTA.astro';
import config from '../../site.config';

const title = "Home";
const description = "";
---

<FullWidth title={title} description={description} config={config}>
  <Hero variant="split" heading="First" />
  <CTA variant="default" heading="Second" />
</FullWidth>
`;

    const schema = parseAstroToSchema(astro, 'index');
    expect(schema.sections).toHaveLength(2);
    expect(schema.sections[0]!.component).toBe('Hero');
    expect(schema.sections[1]!.component).toBe('CTA');
  });

  it('assigns unique IDs to sections', () => {
    const astro = `---
import FullWidth from '@agency/ui/layouts/FullWidth.astro';
import Hero from '@agency/ui/components/Hero.astro';
import CTA from '@agency/ui/components/CTA.astro';
import config from '../../site.config';

const title = "Test";
const description = "";
---

<FullWidth title={title} description={description} config={config}>
  <Hero heading="A" />
  <CTA heading="B" />
</FullWidth>
`;

    const schema = parseAstroToSchema(astro, 'test');
    const ids = schema.sections.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('handles page with no sections', () => {
    const astro = `---
import FullWidth from '@agency/ui/layouts/FullWidth.astro';
import config from '../../site.config';

const title = "Empty";
const description = "";
---

<FullWidth title={title} description={description} config={config}>
</FullWidth>
`;

    const schema = parseAstroToSchema(astro, 'empty');
    expect(schema.page).toBe('empty');
    expect(schema.sections).toHaveLength(0);
  });

  it('sets page name from parameter', () => {
    const astro = `---
import FullWidth from '@agency/ui/layouts/FullWidth.astro';
import config from '../../site.config';
const title = "Test";
const description = "";
---
<FullWidth title={title} description={description} config={config}>
</FullWidth>
`;

    const schema = parseAstroToSchema(astro, 'my-page');
    expect(schema.page).toBe('my-page');
  });
});

describe('round-trip: compile → parse', () => {
  it('preserves page metadata through round-trip', () => {
    const original: PageSchema = {
      page: 'index',
      title: 'Home',
      layout: 'FullWidth',
      seo: { title: 'Home', description: 'Welcome' },
      sections: [
        {
          id: 'hero-1',
          component: 'Hero',
          variant: 'centered',
          props: { heading: 'Hello World' },
        },
      ],
    };

    const astro = compilePageSchema(original);
    const parsed = parseAstroToSchema(astro, 'index');

    expect(parsed.page).toBe(original.page);
    expect(parsed.layout).toBe(original.layout);
    expect(parsed.title).toBe(original.title);
    expect(parsed.seo.description).toBe(original.seo.description);
  });

  it('preserves component and variant through round-trip', () => {
    const original: PageSchema = {
      page: 'test',
      title: 'Test',
      layout: 'SingleColumn',
      seo: {},
      sections: [
        {
          id: 'hero-1',
          component: 'Hero',
          variant: 'split',
          props: { heading: 'Test Heading' },
        },
        {
          id: 'cta-1',
          component: 'CTA',
          variant: 'minimal',
          props: { heading: 'Get Started', buttonText: 'Go' },
        },
      ],
    };

    const astro = compilePageSchema(original);
    const parsed = parseAstroToSchema(astro, 'test');

    expect(parsed.sections).toHaveLength(2);
    expect(parsed.sections[0]!.component).toBe('Hero');
    expect(parsed.sections[0]!.variant).toBe('split');
    expect(parsed.sections[0]!.props.heading).toBe('Test Heading');
    expect(parsed.sections[1]!.component).toBe('CTA');
    expect(parsed.sections[1]!.variant).toBe('minimal');
  });

  it('preserves Section wrapper metadata through round-trip', () => {
    const original: PageSchema = {
      page: 'test',
      title: 'Test',
      layout: 'FullWidth',
      seo: {},
      sections: [
        {
          id: 'features-1',
          component: 'Features',
          variant: 'grid',
          props: {},
          heading: 'Our Features',
          subheading: 'Why choose us',
          background: 'dark',
        },
      ],
    };

    const astro = compilePageSchema(original);
    const parsed = parseAstroToSchema(astro, 'test');

    expect(parsed.sections).toHaveLength(1);
    const section = parsed.sections[0]!;
    expect(section.component).toBe('Features');
    expect(section.heading).toBe('Our Features');
    expect(section.subheading).toBe('Why choose us');
    expect(section.background).toBe('dark');
  });
});
