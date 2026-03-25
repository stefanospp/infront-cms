import type { CollectionConfig } from '@sonicjs-cms/core';

const tutoringSubjects: CollectionConfig = {
  name: 'tutoring_subjects',
  displayName: 'Tutoring Subjects',
  description: 'Subjects available for tutoring. Title = subject name.',
  icon: '🔬',
  managed: true,
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      accent_color: { type: 'string', title: 'Accent Color', description: 'CSS variable e.g. var(--th-green)' },
      levels: { type: 'json', title: 'Levels', description: 'JSON array of level strings e.g. IGCSE, A-Level' },
      sort: { type: 'number', title: 'Sort Order' },
    },
  },
  listFields: ['title', 'accent_color'],
  defaultSort: 'created_at',
};

export default tutoringSubjects;
