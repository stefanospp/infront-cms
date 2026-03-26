import type { CollectionConfig } from '@sonicjs-cms/core';

const tutoringTiers: CollectionConfig = {
  name: 'tutoring_tiers',
  displayName: 'Tutoring Tiers',
  description: 'Tutoring pricing tiers. Title = tier name.',
  icon: '💰',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      emoji: { type: 'string', title: 'Emoji' },
      size_label: { type: 'string', title: 'Size Label', placeholder: 'e.g. (2–4 students)' },
      description: { type: 'textarea', title: 'Description' },
      benefits: {
        type: 'array',
        title: 'Benefits',
        helpText: 'List of benefits for this tier',
        items: { type: 'string', title: 'Benefit' },
      },
      best_for: { type: 'textarea', title: 'Best For' },
      price: { type: 'string', title: 'Price', placeholder: 'e.g. €30' },
      price_unit: { type: 'string', title: 'Price Unit', placeholder: 'e.g. /hour or /student/hour' },
      accent_color: { type: 'string', title: 'Accent Color', helpText: 'CSS variable e.g. var(--th-yellow)' },
      cta_text: { type: 'string', title: 'CTA Text' },
      cta_url: { type: 'url', title: 'CTA URL', helpText: 'WhatsApp deep link or other URL' },
      sort: { type: 'number', title: 'Sort Order' },
    },
  },
  listFields: ['title', 'price'],
  defaultSort: 'created_at',
};

export default tutoringTiers;
