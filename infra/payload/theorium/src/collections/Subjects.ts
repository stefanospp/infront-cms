import type { CollectionConfig } from 'payload'

export const Subjects: CollectionConfig = {
  slug: 'subjects',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'order'],
  },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar' } },
    { name: 'code', type: 'text', required: true, admin: { description: '3-letter code: BIO, CHE, PHY' } },
    { name: 'color', type: 'text', defaultValue: '#fff33b', admin: { description: 'Hex color' } },
    { name: 'tagline', type: 'text', admin: { description: 'One-line tagline for the subject' } },
    { name: 'fullDescription', type: 'richText' },
    {
      name: 'levels',
      type: 'array',
      admin: { description: 'Qualification levels with topics' },
      fields: [
        { name: 'name', type: 'text', required: true, admin: { description: 'e.g. IGCSE, A-Level, IB HL/SL' } },
        {
          name: 'examBoards',
          type: 'array',
          fields: [{ name: 'board', type: 'text', required: true }],
        },
        {
          name: 'topics',
          type: 'array',
          fields: [{ name: 'topic', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'whyStudy',
      type: 'array',
      admin: { description: 'Reasons to study this subject' },
      fields: [{ name: 'reason', type: 'text', required: true }],
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
