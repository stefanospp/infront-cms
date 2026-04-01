import type { CollectionConfig } from 'payload'

export const Portfolio: CollectionConfig = {
  slug: 'portfolio',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'active', 'display_order'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'url',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'screenshot',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'challenge',
      type: 'textarea',
    },
    {
      name: 'approach',
      type: 'textarea',
    },
    {
      name: 'results',
      type: 'array',
      fields: [
        { name: 'metric', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
      ],
    },
    {
      name: 'tech_stack',
      type: 'array',
      fields: [
        { name: 'tag', type: 'text', required: true },
      ],
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
