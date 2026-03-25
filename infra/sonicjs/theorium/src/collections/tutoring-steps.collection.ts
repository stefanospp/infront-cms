import type { CollectionConfig } from '@sonicjs-cms/core';

const tutoringSteps: CollectionConfig = {
  name: 'tutoring_steps',
  displayName: 'Tutoring Steps',
  description: 'How-it-works steps, shared by tutoring and courses pages. Title = step title.',
  icon: '📋',
  managed: true,
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      emoji: { type: 'string', title: 'Emoji', description: 'Emoji or number' },
      description: { type: 'textarea', title: 'Description' },
      page: {
        type: 'select',
        title: 'Page',
        required: true,
        enum: ['tutoring', 'courses'],
      },
      sort: { type: 'number', title: 'Sort Order' },
    },
    required: ['page'],
  },
  listFields: ['title', 'page'],
  defaultSort: 'created_at',
};

export default tutoringSteps;
