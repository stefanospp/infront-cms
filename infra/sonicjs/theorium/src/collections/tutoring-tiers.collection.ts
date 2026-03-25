import type { CollectionConfig } from '@sonicjs-cms/core';

const tutoringTiers: CollectionConfig = {
  name: 'tutoring_tiers',
  displayName: 'Tutoring Tiers',
  description: 'Tutoring pricing tiers. Title = tier name.',
  icon: '💰',
  managed: true,
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      emoji: { type: 'string', title: 'Emoji' },
      size_label: { type: 'string', title: 'Size Label', description: 'e.g. (2–4 students)' },
      description: { type: 'textarea', title: 'Description' },
      benefits: { type: 'json', title: 'Benefits', description: 'JSON array of benefit strings' },
      best_for: { type: 'textarea', title: 'Best For' },
      price: { type: 'string', title: 'Price', description: 'e.g. €30' },
      price_unit: { type: 'string', title: 'Price Unit', description: 'e.g. /hour or /student/hour' },
      accent_color: { type: 'string', title: 'Accent Color', description: 'CSS variable e.g. var(--th-yellow)' },
      cta_text: { type: 'string', title: 'CTA Text' },
      cta_url: { type: 'url', title: 'CTA URL', description: 'WhatsApp deep link or other URL' },
      sort: { type: 'number', title: 'Sort Order' },
    },
  },
  listFields: ['title', 'price'],
  defaultSort: 'created_at',
};

export default tutoringTiers;
