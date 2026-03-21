import type { SiteConfig } from '@agency/config';

const config: SiteConfig = {
  name: 'Agency Template',
  tagline: 'A modern website template for your business',
  url: 'https://example.com',
  locale: 'en-GB',

  contact: {
    email: 'info@example.com',
    phone: '+44 20 7946 0000',
    address: {
      street: '123 Main Street',
      city: 'London',
      postcode: 'EC1A 1BB',
      country: 'GB',
    },
  },

  seo: {
    defaultTitle: 'Agency Template — Modern Business Website',
    titleTemplate: '%s | Agency Template',
    defaultDescription:
      'A professional website template built with Astro, Tailwind CSS, and modern web standards.',
    defaultOgImage: '/og-default.jpg',
    structuredData: {
      type: 'Organization',
    },
  },

  nav: {
    items: [
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/#services' },
      { label: 'Contact', href: '/contact' },
    ],
    cta: { label: 'Get in Touch', href: '/contact' },
  },

  footer: {
    columns: [
      {
        title: 'Company',
        links: [
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Terms of Service', href: '/terms' },
        ],
      },
    ],
    socials: {
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
    },
    legalLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },

  analytics: {
    provider: 'plausible',
    siteId: 'example.com',
  },

  theme: {
    navStyle: 'sticky',
    footerStyle: 'multi-column',
    heroDefault: 'centered',
    borderStyle: 'rounded',
  },
};

export default config;
