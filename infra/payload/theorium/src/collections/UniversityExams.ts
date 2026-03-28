import type { CollectionConfig } from 'payload'

export const UniversityExams: CollectionConfig = {
  slug: 'university-exams',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'shortName', 'region', 'order'],
  },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar' } },
    { name: 'shortName', type: 'text', required: true, admin: { description: 'e.g. UCAT, BMAT, SAT / AP' } },
    { name: 'region', type: 'text', required: true, admin: { description: 'e.g. United Kingdom, Netherlands' } },
    { name: 'description', type: 'textarea', required: true },
    { name: 'fullDescription', type: 'richText' },
    { name: 'color', type: 'text', defaultValue: '#a8e8ff' },
    { name: 'forWho', type: 'text', admin: { description: 'Target audience description' } },
    {
      name: 'sections',
      type: 'array',
      admin: { description: 'Exam sections or components' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
    {
      name: 'whatWeOffer',
      type: 'array',
      admin: { description: 'Services and support offered' },
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    { name: 'timeline', type: 'text', admin: { description: 'When the exam occurs and prep timeline' } },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
