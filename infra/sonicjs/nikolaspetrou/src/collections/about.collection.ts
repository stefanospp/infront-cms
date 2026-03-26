import type { CollectionConfig } from '@sonicjs-cms/core';

const about: CollectionConfig = {
  name: 'about',
  displayName: 'About Page',
  description: 'About page content — heading, description, values. One item only.',
  icon: '👤',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      heading: { type: 'string', title: 'Heading' },
      subheading: { type: 'string', title: 'Subheading' },
      description: { type: 'quill', title: 'Description' },
      hero_image: { type: 'url', title: 'Hero Image URL' },
      cta_text: { type: 'string', title: 'CTA Text' },
      values_heading: { type: 'string', title: 'Values Section Heading' },
      values_description: { type: 'quill', title: 'Values Description' },
    },
  },
  listFields: ['title'],
};

export default about;
