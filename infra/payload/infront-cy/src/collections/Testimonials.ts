import type { CollectionConfig } from 'payload'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'role',
    defaultColumns: ['role', 'industry', 'city', 'rating', 'display_order'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
      required: true,
    },
    {
      name: 'industry',
      type: 'text',
    },
    {
      name: 'city',
      type: 'text',
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'display_order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
}
