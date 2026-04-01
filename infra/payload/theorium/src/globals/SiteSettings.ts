import type { GlobalConfig } from 'payload'
import { globalRebuildHook } from '../hooks/triggerRebuild'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: { read: () => true },
  hooks: { afterChange: [globalRebuildHook] },
  fields: [
    { name: 'siteName', type: 'text', required: true, defaultValue: 'Theorium' },
    { name: 'tagline', type: 'text', defaultValue: 'Private Science Tutoring' },
    {
      name: 'navLinks',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    { name: 'ctaLabel', type: 'text', defaultValue: 'Get in touch' },
    { name: 'ctaHref', type: 'text', defaultValue: '/contact' },
    {
      type: 'group',
      name: 'contact',
      fields: [
        { name: 'email', type: 'email', defaultValue: 'theodora@theorium.cy' },
        { name: 'phone', type: 'text' },
        { name: 'whatsapp', type: 'text', admin: { description: 'WhatsApp number with country code (e.g. 35799000000)' } },
        { name: 'viber', type: 'text', admin: { description: 'Viber number with country code' } },
        { name: 'location', type: 'text', defaultValue: 'Larnaca, Cyprus' },
        { name: 'responseTime', type: 'text', defaultValue: 'Usually replies within 2 hours' },
      ],
    },
    {
      type: 'group',
      name: 'footer',
      fields: [
        { name: 'builderName', type: 'text', defaultValue: 'infront.cy' },
        { name: 'builderLink', type: 'text', defaultValue: 'https://infront.cy' },
      ],
    },
  ],
}
