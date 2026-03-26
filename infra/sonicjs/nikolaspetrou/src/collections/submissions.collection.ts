import type { CollectionConfig } from '@sonicjs-cms/core';

const submissions: CollectionConfig = {
  name: 'submissions',
  displayName: 'Form Submissions',
  description: 'Contact form submissions — stored automatically, viewable in admin.',
  icon: '📬',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name' },
      email: { type: 'email', title: 'Email' },
      phone: { type: 'string', title: 'Phone' },
      message: { type: 'textarea', title: 'Message' },
      is_spam: { type: 'boolean', title: 'Spam', default: false },
      read: { type: 'boolean', title: 'Read', default: false },
      ip_address: { type: 'string', title: 'IP Address' },
      user_agent: { type: 'string', title: 'User Agent' },
    },
  },
  listFields: ['title', 'email', 'read'],
  defaultSort: 'created_at',
  defaultSortOrder: 'desc',
};

export default submissions;
