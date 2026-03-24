import type { SiteConfig } from '@agency/config';

const config: SiteConfig = {
  name: 'Language Connections',
  tagline: 'Private English Lessons in Paralimni, Cyprus',
  url: 'https://language-connections.infront.cy',
  locale: 'en-GB',

  contact: {
    email: 'info@languageconnections.cy',
    phone: '+357 99 875604',
    address: {
      street: '1ης Απριλίου 20',
      city: 'Paralimni',
      postcode: '5281',
      country: 'CY',
    },
  },

  seo: {
    defaultTitle: 'Language Connections — Private English Lessons & Cambridge Exam Prep in Paralimni, Cyprus',
    titleTemplate: '%s | Language Connections Paralimni',
    defaultDescription:
      'Paralimni\'s trusted private English institute. Cambridge exam preparation (YLE to CPE), IELTS, and Michigan ECCE for all ages. Small classes, 93% pass rate. Serving Paralimni, Deryneia, Sotira & Protaras since 2009.',
    defaultOgImage: '/og-default.svg',
    structuredData: {
      type: 'EducationalOrganization',
    },
  },

  nav: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Programs', href: '/programs' },
      { label: 'Contact', href: '/contact' },
    ],
    cta: { label: 'Enroll Now', href: '/contact' },
  },

  footer: {
    columns: [
      {
        title: 'Programs',
        links: [
          { label: 'Young Learners', href: '/programs#young-learners' },
          { label: 'Teenagers', href: '/programs#teenagers' },
          { label: 'Adults', href: '/programs#adults' },
          { label: 'Exam Preparation', href: '/programs#exam-prep' },
        ],
      },
      {
        title: 'Institute',
        links: [
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' },
          { label: 'Privacy Policy', href: '/privacy' },
        ],
      },
    ],
    socials: {
      facebook: 'https://www.facebook.com/profile.php?id=100085284251124',
    },
    legalLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
    text: '© 2026 Language Connections by Annie Petrou. All rights reserved.',
  },

  theme: {
    navStyle: 'sticky',
    footerStyle: 'multi-column',
    heroDefault: 'split',
    borderStyle: 'rounded',
  },
};

export default config;
