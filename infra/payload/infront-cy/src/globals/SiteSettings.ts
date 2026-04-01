import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'site_name',
      type: 'text',
      defaultValue: 'infront.cy',
    },
    {
      name: 'tagline',
      type: 'text',
    },
    {
      type: 'group',
      name: 'contact',
      fields: [
        { name: 'email', type: 'email', defaultValue: 'hello@infront.cy' },
        { name: 'phone', type: 'text' },
        { name: 'address', type: 'text', defaultValue: 'Larnaca, Cyprus' },
      ],
    },
    {
      type: 'group',
      name: 'social',
      fields: [
        { name: 'linkedin', type: 'text' },
        { name: 'facebook', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'twitter', type: 'text' },
      ],
    },
  ],
}
