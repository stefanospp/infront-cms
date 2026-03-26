import type { CollectionConfig } from '@sonicjs-cms/core';

const services: CollectionConfig = {
  name: 'services',
  displayName: 'Services',
  description: 'Service offerings — title, description, tags, video.',
  icon: '🛠️',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      description: { type: 'quill', title: 'Description' },
      tags: {
        type: 'array', title: 'Tags',
        items: { type: 'string', title: 'Tag' },
      },
      icon: { type: 'string', title: 'Icon' },
      video_url: { type: 'url', title: 'Background Video URL' },
      sort_order: { type: 'number', title: 'Sort Order' },
    },
  },
  listFields: ['title', 'sort_order'],
  defaultSort: 'created_at',
};

export default services;
