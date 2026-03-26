import type { CollectionConfig } from '@sonicjs-cms/core';

const siteSettings: CollectionConfig = {
  name: 'site_settings',
  displayName: 'Site Settings',
  description: 'Global site config — identity, contact, nav, footer, SEO, social links. One item only.',
  icon: '⚙️',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      tagline: { type: 'string', title: 'Tagline' },
      email: { type: 'email', title: 'Contact Email' },
      seo_title: { type: 'string', title: 'SEO Title' },
      seo_description: { type: 'textarea', title: 'SEO Description' },
      instagram_url: { type: 'url', title: 'Instagram URL' },
      facebook_url: { type: 'url', title: 'Facebook URL' },
      notification_emails: {
        type: 'array', title: 'Notification Emails',
        helpText: 'Email addresses that receive contact form notifications',
        items: { type: 'email', title: 'Email' },
      },
      nav_items: {
        type: 'array', title: 'Navigation Links',
        items: { type: 'object', properties: {
          label: { type: 'string', title: 'Label', required: true },
          href: { type: 'string', title: 'URL', required: true },
        }},
      },
      nav_cta_label: { type: 'string', title: 'CTA Button Label' },
      nav_cta_href: { type: 'string', title: 'CTA Button Link' },
      footer_text: { type: 'string', title: 'Footer Copyright Text' },
    },
  },
  listFields: ['title'],
};

export default siteSettings;
