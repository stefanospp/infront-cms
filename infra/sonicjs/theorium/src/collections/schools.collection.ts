import type { CollectionConfig } from '@sonicjs-cms/core';

const schools: CollectionConfig = {
  name: 'schools',
  displayName: 'Schools',
  description: 'Schools served — curriculum and subject data. Title = school name.',
  icon: '🏫',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      type: { type: 'string', title: 'School Type', placeholder: 'e.g. Private English School, IB World School' },
      qualifications: {
        type: 'array',
        title: 'Qualifications',
        helpText: 'Qualification badges shown on the school card',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', title: 'Label', required: true },
            color: {
              type: 'select',
              title: 'Color',
              enum: ['yellow', 'green', 'blue', 'orange', 'purple', 'default'],
            },
          },
        },
      },
      subjects: {
        type: 'array',
        title: 'Subjects',
        helpText: 'Subjects taught at this school',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Subject Name', required: true },
            accentColor: {
              type: 'select',
              title: 'Accent Color',
              enum: ['green', 'blue', 'orange'],
            },
            topics: { type: 'textarea', title: 'Topics Covered' },
          },
        },
      },
      sort: { type: 'number', title: 'Sort Order' },
    },
  },
  listFields: ['title', 'type'],
  defaultSort: 'created_at',
};

export default schools;
