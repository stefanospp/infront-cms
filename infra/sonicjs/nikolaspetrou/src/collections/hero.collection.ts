import type { CollectionConfig } from '@sonicjs-cms/core';

const hero: CollectionConfig = {
  name: 'hero',
  displayName: 'Hero Section',
  description: 'Homepage hero — heading, CTAs, background video. One item only.',
  icon: '🎬',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      eyebrow: { type: 'string', title: 'Eyebrow Text' },
      heading: { type: 'quill', title: 'Heading' },
      subheading: { type: 'textarea', title: 'Subheading' },
      cta_text: { type: 'string', title: 'Primary CTA Text' },
      cta_href: { type: 'url', title: 'Primary CTA Link' },
      secondary_cta_text: { type: 'string', title: 'Secondary CTA Text' },
      secondary_cta_href: { type: 'url', title: 'Secondary CTA Link' },
      background_video: { type: 'url', title: 'Background Video URL' },
      background_poster: { type: 'url', title: 'Background Poster Image URL' },
    },
  },
  listFields: ['title'],
};

export default hero;
