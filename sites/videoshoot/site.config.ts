import type { SiteConfig } from '@agency/config';

const config: SiteConfig = {
  name: 'Nikolas Petrou',
  tagline: 'Videographer & Content Creator',
  url: 'https://videoshoot.infront.cy',
  locale: 'en-GB',

  contact: {
    email: 'hello@nikolaspetrou.com',
    phone: '',
    address: {
      street: '',
      city: '',
      postcode: '',
      country: '',
    },
  },

  seo: {
    defaultTitle: 'Nikolas Petrou — Videographer & Content Creator',
    titleTemplate: '%s | Nikolas Petrou',
    defaultDescription:
      'Professional videographer and content creator. Cinematic video production, creative direction, and storytelling that captures attention and delivers results.',
    defaultOgImage: '/og-default.svg',
  },

  nav: {
    items: [
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'Works', href: '/works' },
      { label: 'Contact', href: '/contact' },
    ],
    cta: { label: "Let's talk", href: '/contact' },
  },

  footer: {
    columns: [
      {
        title: 'About',
        links: [
          { label: 'About Me', href: '/about' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      {
        title: 'Services',
        links: [
          { label: 'Video Production', href: '/services' },
          { label: 'Creative Direction', href: '/services' },
          { label: 'Content Creation', href: '/services' },
        ],
      },
      {
        title: 'Portfolio',
        links: [
          { label: 'Latest Works', href: '/works' },
        ],
      },
    ],
    socials: {
      instagram: 'https://instagram.com/nikolaspetrouu',
      facebook: 'https://facebook.com/Nikolaspetrouu',
    },
    legalLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
    text: '© 2026 Nikolas Petrou. All rights reserved.',
  },

  theme: {
    navStyle: 'fixed',
    footerStyle: 'multi-column',
    heroDefault: 'fullscreen',
    borderStyle: 'pill',
  },
};

export default config;
