import type { CollectionConfig } from 'payload'

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'project', 'status', 'createdAt'],
  },
  access: {
    // Public can create (contact form), only admins can read/update/delete
    create: () => true,
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    {
      name: 'project',
      type: 'text',
      admin: { description: 'Project type selected' },
    },
    { name: 'message', type: 'textarea', required: true },
    {
      name: 'budget',
      type: 'text',
      admin: { description: 'Budget range selected' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Read', value: 'read' },
        { label: 'Replied', value: 'replied' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      type: 'group',
      name: 'metadata',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'ip', type: 'text' },
        { name: 'userAgent', type: 'text' },
        { name: 'spam', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
}
