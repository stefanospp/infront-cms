import type { CollectionConfig } from '@sonicjs-cms/core';

const siteSettings: CollectionConfig = {
  name: 'site_settings',
  displayName: 'Site Settings',
  description: 'Global site configuration — identity, contact, navigation, footer, SEO. One item only.',
  icon: '⚙️',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      // Identity
      tagline: { type: 'string', title: 'Tagline' },
      url: { type: 'url', title: 'Site URL' },
      locale: { type: 'string', title: 'Locale', default: 'en-GB' },
      // Contact
      contact_email: { type: 'email', title: 'Contact Email' },
      contact_phone: { type: 'string', title: 'Contact Phone' },
      contact_city: { type: 'string', title: 'City' },
      contact_country: { type: 'string', title: 'Country' },
      // Navigation
      nav_items: {
        type: 'array',
        title: 'Navigation Links',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', title: 'Label', required: true },
            href: { type: 'string', title: 'URL', required: true },
          },
        },
      },
      nav_cta_label: { type: 'string', title: 'CTA Button Label' },
      nav_cta_href: { type: 'string', title: 'CTA Button Link' },
      // Footer
      footer_text: { type: 'string', title: 'Footer Copyright Text' },
      // SEO
      meta_default_title: { type: 'string', title: 'Default Page Title' },
      meta_title_template: { type: 'string', title: 'Title Template', helpText: 'Use %s for page title, e.g. "%s | Theorium"' },
      meta_default_description: { type: 'textarea', title: 'Default Meta Description' },
      meta_og_image: { type: 'string', title: 'Default OG Image Path' },
      structured_data_type: {
        type: 'select',
        title: 'Structured Data Type',
        enum: ['LocalBusiness', 'Organization', 'EducationalOrganization'],
        default: 'LocalBusiness',
      },
    },
  },
  listFields: ['title'],
};

export default siteSettings;
