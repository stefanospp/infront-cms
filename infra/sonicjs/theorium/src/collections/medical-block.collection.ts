import type { CollectionConfig } from '@sonicjs-cms/core';

const medicalBlock: CollectionConfig = {
  name: 'medical_block',
  displayName: 'Medical Block',
  description: 'Medical school applications specialisation block. Only one item should exist (singleton).',
  icon: '🏥',
  managed: true,
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      description: { type: 'textarea', title: 'Description' },
      subjects: { type: 'json', title: 'Subjects', description: 'JSON array of subject strings' },
    },
  },
  listFields: ['title'],
};

export default medicalBlock;
