import type { SiteConfig } from '@agency/config';

const config: SiteConfig = {
  name: 'AbroadJobs',
  tagline: 'Jobs Abroad with Relocation Support',
  url: 'https://abroadjobs.eu',
  locale: 'en',

  contact: {
    email: 'hello@abroadjobs.eu',
  },

  seo: {
    defaultTitle: 'Jobs Abroad with Relocation Support — AbroadJobs.eu',
    titleTemplate: '%s | AbroadJobs.eu',
    defaultDescription: 'Find jobs abroad with visa sponsorship and relocation packages. Employers post, job seekers browse for free.',
    defaultOgImage: '/og-default.svg',
  },

  nav: {
    items: [
      { label: 'Jobs', href: '/' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'About', href: '/about' },
    ],
    cta: {
      label: 'Post a Job — €89',
      href: '/post',
    },
  },

  footer: {
    columns: [],
    legalLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
    text: '© 2026 AbroadJobs.eu. All rights reserved.',
  },

  theme: {
    navStyle: 'sticky',
    footerStyle: 'minimal',
    heroDefault: 'minimal',
    borderStyle: 'rounded',
  },
};

export default config;
