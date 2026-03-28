import type { GlobalConfig } from 'payload'

export const HomeSections: GlobalConfig = {
  slug: 'home-sections',
  access: { read: () => true },
  fields: [
    {
      type: 'group',
      name: 'hero',
      fields: [
        { name: 'badge', type: 'text', defaultValue: 'In-Person in Larnaca · Online Europe-Wide' },
        { name: 'heading', type: 'text', defaultValue: 'SCIENCE.' },
        { name: 'headingHighlight', type: 'text', defaultValue: 'EVERY LEVEL.' },
        { name: 'subheading', type: 'textarea' },
        {
          name: 'stats',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        { name: 'ctaText', type: 'text', defaultValue: 'View Courses' },
        { name: 'ctaHref', type: 'text', defaultValue: '/courses' },
      ],
    },
    {
      type: 'group',
      name: 'why',
      fields: [
        { name: 'heading', type: 'text', defaultValue: 'Why Theorium.' },
        { name: 'description', type: 'textarea' },
        {
          name: 'features',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea', required: true },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'howItWorks',
      fields: [
        { name: 'heading', type: 'text', defaultValue: 'How It Works.' },
        {
          name: 'steps',
          type: 'array',
          fields: [
            { name: 'number', type: 'text', required: true },
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea', required: true },
          ],
        },
      ],
    },
    {
      name: 'examPeriods',
      type: 'array',
      admin: { description: 'Key exam periods shown on the courses page' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'dates', type: 'text', required: true },
      ],
    },
  ],
}
