import type { CollectionConfig } from '@sonicjs-cms/core';

const tutoringSubjects: CollectionConfig = {
  name: 'tutoring_subjects',
  displayName: 'Tutoring Subjects',
  description: 'Subjects available for tutoring. Title = subject name.',
  icon: '🔬',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      accent_color: { type: 'string', title: 'Accent Color', helpText: 'CSS variable e.g. var(--th-green)' },
      levels: {
        type: 'array',
        title: 'Levels',
        helpText: 'Available exam levels for this subject',
        items: { type: 'string', title: 'Level' },
      },
      sort: { type: 'number', title: 'Sort Order' },
    },
  },
  listFields: ['title', 'accent_color'],
  defaultSort: 'created_at',
};

export default tutoringSubjects;
