import type { CollectionConfig } from 'payload'

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'service', 'createdAt'],
  },
  access: {
    create: () => true,
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'business',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'service',
      type: 'text',
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'gdpr_consent',
      type: 'checkbox',
      required: true,
    },
    {
      name: 'ip_hash',
      type: 'text',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
