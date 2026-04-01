import type { CollectionConfig } from 'payload'

export const FAQ: CollectionConfig = {
  slug: 'faq',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'active', 'display_order'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
    },
    {
      name: 'answer',
      type: 'textarea',
      required: true,
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
