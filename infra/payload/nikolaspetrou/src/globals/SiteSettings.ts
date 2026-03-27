import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'Nikolas Petrou',
    },
    {
      name: 'tagline',
      type: 'text',
      defaultValue: 'Capturing moments that move.',
    },
    {
      name: 'navLinks',
      type: 'array',
      admin: { description: 'Main navigation links' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      type: 'group',
      name: 'contact',
      fields: [
        { name: 'email', type: 'email', defaultValue: 'hello@nikolaspetrou.com' },
        { name: 'phone', type: 'text' },
      ],
    },
    {
      type: 'group',
      name: 'social',
      fields: [
        { name: 'instagram', type: 'text' },
        { name: 'vimeo', type: 'text' },
        { name: 'youtube', type: 'text' },
      ],
    },
  ],
}
