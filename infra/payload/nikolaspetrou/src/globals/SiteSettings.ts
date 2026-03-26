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
      type: 'group',
      name: 'hero',
      fields: [
        {
          name: 'heading',
          type: 'text',
          defaultValue: 'Nikolas Petrou',
        },
        {
          name: 'subtext',
          type: 'text',
          defaultValue: 'Capturing moments that move.',
        },
        {
          name: 'video_url',
          type: 'text',
          admin: {
            description: 'Full-screen hero background video URL',
          },
        },
      ],
    },
    {
      type: 'group',
      name: 'contact',
      fields: [
        {
          name: 'email',
          type: 'email',
          defaultValue: 'hello@nikolaspetrou.com',
        },
        {
          name: 'phone',
          type: 'text',
        },
      ],
    },
    {
      type: 'group',
      name: 'social',
      fields: [
        {
          name: 'instagram',
          type: 'text',
        },
        {
          name: 'vimeo',
          type: 'text',
        },
        {
          name: 'youtube',
          type: 'text',
        },
      ],
    },
    {
      type: 'array',
      name: 'clients',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'aboutText',
      type: 'textarea',
      defaultValue:
        'Based in Los Angeles, working with brands worldwide to create visual content that resonates with audiences and drives engagement.',
    },
    {
      type: 'array',
      name: 'horizontalWords',
      admin: {
        description: 'Words displayed in the horizontal scroll section',
      },
      fields: [
        {
          name: 'word',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
