import type { CollectionConfig } from '@sonicjs-cms/core';

const resources: CollectionConfig = {
  name: 'resources',
  displayName: 'Resources',
  description: 'Free study resources — revision notes, past papers, formula sheets',
  icon: '📚',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      subject: {
        type: 'select',
        title: 'Subject',
        required: true,
        enum: ['Biology', 'Chemistry', 'Physics', 'Mathematics'],
      },
      exam_board: {
        type: 'select',
        title: 'Exam Board',
        required: true,
        enum: ['IGCSE', 'A-Level', 'IB', 'Pancyprian', 'SAT'],
      },
      resource_type: {
        type: 'select',
        title: 'Resource Type',
        required: true,
        enum: ['Revision Notes', 'Past Papers', 'Topic Summary', 'Formula Sheet', 'Checklist'],
      },
      description: { type: 'textarea', title: 'Description' },
      drive_url: { type: 'url', title: 'Download URL', required: true, description: 'Google Drive or download link' },
      sort: { type: 'number', title: 'Sort Order' },
    },
    required: ['subject', 'exam_board', 'resource_type', 'drive_url'],
  },
  listFields: ['title', 'subject', 'exam_board'],
  searchFields: ['title', 'description'],
  defaultSort: 'created_at',
};

export default resources;
