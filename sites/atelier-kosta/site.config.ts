import type { SiteConfig } from '@agency/config';

const config: SiteConfig = {
  name: 'Atelier Kosta',
  tagline: 'Architecture & Interior Design Studio',
  url: 'https://atelierkosta.cy',
  locale: 'en-GB',

  contact: {
    email: 'studio@atelierkosta.cy',
    phone: '+357 22 456 789',
    address: {
      street: 'Stasikratous 12',
      city: 'Nicosia',
      postcode: '1065',
      country: 'Cyprus',
    },
  },

  seo: {
    defaultTitle: 'Atelier Kosta — Architecture & Interior Design',
    titleTemplate: '%s | Atelier Kosta',
    defaultDescription:
      'Boutique architecture studio in Nicosia, Cyprus. Residential and commercial projects with a focus on timeless, contextual design.',
    defaultOgImage: '/og-default.svg',
  },

  nav: {
    items: [
      { label: 'Projects', href: '/projects' },
      { label: 'Studio', href: '/studio' },
      { label: 'Team', href: '/team' },
      { label: 'Contact', href: '/contact' },
    ],
    cta: { label: 'Book Consultation', href: '/contact' },
  },

  footer: {
    columns: [],
    legalLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
    text: '\u00a9 2026 Atelier Kosta. Stasikratous 12, Nicosia, Cyprus.',
  },

  cms: {
    url: 'https://cms.atelierkosta.cy',
  },

  theme: {
    navStyle: 'fixed',
    footerStyle: 'minimal',
    heroDefault: 'fullscreen',
    borderStyle: 'sharp',
  },
};

export default config;
