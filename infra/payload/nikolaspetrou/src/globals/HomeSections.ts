import type { GlobalConfig } from 'payload'

export const HomeSections: GlobalConfig = {
  slug: 'home-sections',
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'group',
      name: 'hero',
      fields: [
        { name: 'heading', type: 'text', defaultValue: 'Nikolas Petrou' },
        { name: 'subtext', type: 'text', defaultValue: 'Capturing moments that move.' },
        { name: 'video_url', type: 'text' },
      ],
    },
    {
      type: 'group',
      name: 'works',
      fields: [
        { name: 'label', type: 'text', defaultValue: '(Selected Works)' },
      ],
    },
    {
      type: 'group',
      name: 'horizontalScroll',
      fields: [
        {
          name: 'words',
          type: 'array',
          fields: [
            { name: 'word', type: 'text', required: true },
            { name: 'videoUrl', type: 'text' },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'services',
      fields: [
        { name: 'label', type: 'text', defaultValue: '(Services)' },
      ],
    },
    {
      type: 'group',
      name: 'clients',
      fields: [
        { name: 'label', type: 'text', defaultValue: '(Selected Clients)' },
      ],
    },
    {
      type: 'group',
      name: 'footer',
      fields: [
        { name: 'label', type: 'text', defaultValue: '(Get in Touch)' },
        { name: 'ctaLine1', type: 'text', defaultValue: "LET'S" },
        { name: 'ctaLine2', type: 'text', defaultValue: 'WORK' },
        { name: 'ctaLine3', type: 'text', defaultValue: 'TOGETHER' },
        { name: 'video_url', type: 'text' },
        { name: 'email', type: 'email', defaultValue: 'hello@nikolaspetrou.com' },
        {
          name: 'socialLinks',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
      ],
    },
  ],
}
