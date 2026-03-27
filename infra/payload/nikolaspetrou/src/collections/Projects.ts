import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'year', 'order'],
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
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'text',
      required: true,
    },
    {
      name: 'year',
      type: 'number',
      required: true,
    },
    {
      name: 'video_url',
      type: 'text',
      required: true,
      admin: {
        description: 'URL to the preview video (plays on hover)',
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'role',
      type: 'text',
      defaultValue: 'Director, Cinematographer',
      admin: {
        description: 'Role on the project — shown on detail page',
      },
    },
    {
      name: 'fullDescription',
      type: 'textarea',
      admin: {
        description: 'Detailed description shown on the project detail page',
      },
    },
    {
      name: 'description',
      type: 'richText',
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
