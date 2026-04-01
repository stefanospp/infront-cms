import type { CollectionConfig } from 'payload'

export const ServicePages: CollectionConfig = {
  slug: 'service_pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'display_order'],
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
      name: 'meta_title',
      type: 'text',
    },
    {
      name: 'meta_description',
      type: 'textarea',
    },
    {
      name: 'hero_heading',
      type: 'text',
    },
    {
      name: 'hero_description',
      type: 'textarea',
    },
    {
      name: 'pain_points',
      type: 'array',
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        { name: 'icon', type: 'text' },
      ],
    },
    {
      name: 'features',
      type: 'array',
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        { name: 'icon', type: 'text' },
      ],
    },
    {
      name: 'faq',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    {
      name: 'cta_heading',
      type: 'text',
    },
    {
      name: 'cta_description',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      admin: { position: 'sidebar' },
    },
    {
      name: 'display_order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
}
