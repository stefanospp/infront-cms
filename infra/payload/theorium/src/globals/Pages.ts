import type { GlobalConfig } from 'payload'

export const Pages: GlobalConfig = {
  slug: 'pages',
  access: { read: () => true },
  fields: [
    {
      type: 'group',
      name: 'about',
      fields: [
        { name: 'bio', type: 'richText' },
        { name: 'photo', type: 'upload', relationTo: 'media' },
        {
          name: 'stats',
          type: 'array',
          fields: [
            { name: 'value', type: 'text', required: true },
            { name: 'label', type: 'text', required: true },
          ],
        },
        {
          name: 'qualifications',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'institution', type: 'text', required: true },
            { name: 'year', type: 'text', required: true },
          ],
        },
        {
          name: 'philosophy',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea', required: true },
          ],
        },
        { name: 'ctaText', type: 'text', defaultValue: 'Get In Touch' },
      ],
    },
    {
      type: 'group',
      name: 'privacy',
      fields: [
        { name: 'lastUpdated', type: 'date' },
        {
          name: 'sections',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'body', type: 'richText', required: true },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'terms',
      fields: [
        { name: 'lastUpdated', type: 'date' },
        {
          name: 'sections',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'body', type: 'richText', required: true },
          ],
        },
      ],
    },
  ],
}
