import type { CollectionConfig } from 'payload'

export const Audits: CollectionConfig = {
  slug: 'audits',
  admin: {
    useAsTitle: 'url',
    defaultColumns: ['url', 'overall_score', 'grade', 'createdAt'],
  },
  access: {
    create: () => true,
    read: () => true,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
    },
    {
      name: 'token',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'business_name',
      type: 'text',
    },
    {
      name: 'overall_score',
      type: 'number',
    },
    {
      name: 'grade',
      type: 'text',
    },
    {
      name: 'results',
      type: 'json',
    },
    {
      name: 'ip_hash',
      type: 'text',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'gdpr_consent',
      type: 'checkbox',
    },
  ],
}
