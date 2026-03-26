import type { CollectionConfig } from '@sonicjs-cms/core';

const reels: CollectionConfig = {
  name: 'reels',
  displayName: 'Reels',
  description: 'Instagram reels — URL, thumbnail, date label.',
  icon: '📱',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      url: { type: 'url', title: 'Instagram Reel URL', required: true },
      image: { type: 'url', title: 'Thumbnail Image URL' },
      date_label: { type: 'string', title: 'Date Label', helpText: 'e.g. "Mar 2026"' },
      sort_order: { type: 'number', title: 'Sort Order' },
    },
    required: ['url'],
  },
  listFields: ['title', 'date_label'],
  defaultSort: 'created_at',
};

export default reels;
