import type { CollectionConfig } from '@sonicjs-cms/core';

const schools: CollectionConfig = {
  name: 'schools',
  displayName: 'Schools',
  description: 'Schools served — curriculum and subject data. Title = school name.',
  icon: '🏫',
  managed: true,
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      type: { type: 'string', title: 'School Type', description: 'e.g. Private English School, IB World School' },
      qualifications: {
        type: 'json',
        title: 'Qualifications',
        description: 'JSON array: [{ "label": "IGCSE", "color": "yellow" }]',
      },
      subjects: {
        type: 'json',
        title: 'Subjects',
        description: 'JSON array: [{ "name": "Biology", "accentColor": "green", "topics": "..." }]',
      },
      sort: { type: 'number', title: 'Sort Order' },
    },
  },
  listFields: ['title', 'type'],
  defaultSort: 'created_at',
};

export default schools;
