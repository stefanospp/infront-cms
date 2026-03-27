import type { CollectionConfig } from 'payload'

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'year', 'order'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'text',
      admin: {
        description: 'Type of work — e.g. "Brand Campaign", "Documentary Series"',
      },
    },
    {
      name: 'year',
      type: 'number',
    },
    {
      name: 'video_url',
      type: 'text',
      admin: {
        description: 'Background video URL shown on hover',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
