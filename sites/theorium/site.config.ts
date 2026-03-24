import type { SiteConfig } from '@agency/config';

const config: SiteConfig = {
  name: 'Theorium',
  tagline: 'Private Science & Maths Tutoring',
  url: 'https://theorium.infront.cy',
  locale: 'en-GB',

  contact: {
    email: 'theodora@theorium.cy',
    phone: '+357 99 000 000',
    address: {
      street: '',
      city: 'Larnaca',
      postcode: '',
      country: 'Cyprus',
    },
  },

  seo: {
    defaultTitle: 'Theorium | Private Science & Maths Tuition in Larnaca, Cyprus',
    titleTemplate: '%s | Theorium',
    defaultDescription:
      'One-on-one science and maths lessons for IGCSE, A-Level, IB, and Pancyprian students in Larnaca. Specialising in medical school preparation and university entrance exams.',
    defaultOgImage: '/og-default.svg',
    structuredData: {
      type: 'LocalBusiness',
    },
  },

  nav: {
    items: [
      { label: 'Tutoring', href: '/tutoring' },
      { label: 'Resources', href: '/resources' },
      { label: 'Courses', href: '/courses' },
    ],
    cta: { label: 'Get in touch', href: '/#contact' },
  },

  cms: {
    url: 'https://cms.theorium.infront.cy',
  },

  footer: {
    columns: [],
    legalLinks: [],
    text: '© 2025 THEORIUM · PRIVATE SCIENCE & MATHS TUITION · LARNACA, CYPRUS',
  },

  theme: {
    navStyle: 'sticky',
    footerStyle: 'minimal',
    heroDefault: 'split',
    borderStyle: 'sharp',
  },
};

export default config;
