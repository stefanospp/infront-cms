import type { CollectionConfig } from '@sonicjs-cms/core';

const heroContent: CollectionConfig = {
  name: 'hero_content',
  displayName: 'Hero Section',
  description: 'Homepage hero — heading, subheading, CTAs, and ticker. One item only.',
  icon: '🏠',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      badge: { type: 'string', title: 'Badge Text', placeholder: 'e.g. Private tutoring · Larnaca, Cyprus' },
      heading: { type: 'string', title: 'Main Heading', required: true },
      heading_highlight: { type: 'string', title: 'Heading Highlight', helpText: 'Second part of the heading, displayed with emphasis' },
      subheading: { type: 'quill', title: 'Subheading', helpText: 'Supports HTML — use <strong> for bold school names' },
      cta_text: { type: 'string', title: 'CTA Button Text' },
      cta_href: { type: 'string', title: 'CTA Button Link' },
      whatsapp_url: { type: 'url', title: 'WhatsApp URL' },
      viber_url: { type: 'url', title: 'Viber URL' },
      ticker_items: {
        type: 'array',
        title: 'Ticker Items',
        helpText: 'Scrolling ticker words — drag to reorder',
        items: { type: 'string', title: 'Ticker Word' },
      },
    },
    required: ['heading'],
  },
  listFields: ['title', 'heading'],
};

export default heroContent;
