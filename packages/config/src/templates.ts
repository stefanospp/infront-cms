import type { TemplateDefinition } from './types.js';

export const templates: TemplateDefinition[] = [
  {
    id: 'business-starter',
    name: 'Business Starter',
    description:
      'Clean, professional template for service businesses. Includes home, about, contact, privacy, and terms pages with a modern blue palette.',
    screenshot: '/templates/business-starter.png',
    category: 'business',
    pages: [
      {
        slug: 'index',
        layout: 'FullWidth',
        sections: [
          {
            component: 'Hero',
            variant: 'centered',
            props: {
              heading: 'Welcome to Your Business',
              subheading: 'A modern website template for your business',
              ctaText: 'Get in Touch',
              ctaHref: '/contact',
            },
          },
          {
            component: 'Section',
            props: { heading: 'Our Services', subheading: 'What we offer', id: 'services' },
          },
          {
            component: 'CardGrid',
            variant: 'three-column',
            props: {
              cards: [
                { title: 'Service One', description: 'Description of your first service.', href: '/contact' },
                { title: 'Service Two', description: 'Description of your second service.', href: '/contact' },
                { title: 'Service Three', description: 'Description of your third service.', href: '/contact' },
              ],
            },
          },
          {
            component: 'Testimonials',
            props: {
              testimonials: [
                { quote: 'Excellent service and results. Highly recommended.', author: 'Client Name', role: 'Position, Company' },
                { quote: 'Professional, responsive, and delivered on time.', author: 'Client Name', role: 'Position, Company' },
                { quote: 'Transformed our online presence completely.', author: 'Client Name', role: 'Position, Company' },
              ],
            },
          },
          {
            component: 'CTA',
            props: {
              heading: 'Ready to get started?',
              description: "Let's talk about your project and see how we can help.",
              buttonText: 'Contact Us',
              buttonHref: '/contact',
            },
          },
        ],
      },
      {
        slug: 'about',
        layout: 'SingleColumn',
        sections: [
          {
            component: 'Section',
            props: {},
          },
          {
            component: 'TeamGrid',
            props: {
              members: [
                { name: 'Team Member', role: 'Founder', bio: 'Short bio here.' },
              ],
            },
          },
          {
            component: 'CTA',
            props: {
              heading: 'Want to work together?',
              buttonText: 'Get in Touch',
              buttonHref: '/contact',
            },
          },
        ],
      },
      {
        slug: 'contact',
        layout: 'SingleColumn',
        sections: [
          { component: 'ContactForm', props: {} },
          { component: 'Map', props: {} },
        ],
      },
      {
        slug: 'privacy',
        layout: 'SingleColumn',
        sections: [],
      },
      {
        slug: 'terms',
        layout: 'SingleColumn',
        sections: [],
      },
    ],
    defaultTheme: {
      navStyle: 'sticky',
      footerStyle: 'multi-column',
      heroDefault: 'centered',
      borderStyle: 'rounded',
    },
    defaultTokens: {
      colors: {
        primary: {
          50: '#f0f5ff', 100: '#e0ebff', 200: '#c2d7ff', 300: '#94b8ff',
          400: '#6694ff', 500: '#3b6ef5', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a5f', 950: '#172554',
        },
        secondary: {
          50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
          400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
          800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065',
        },
        accent: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
          400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
          800: '#9a3412', 900: '#7c2d12', 950: '#431407',
        },
        neutral: {
          50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4',
          400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040',
          800: '#262626', 900: '#171717', 950: '#0a0a0a',
        },
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },
    },
    defaultNav: {
      items: [
        { label: 'About', href: '/about' },
        { label: 'Services', href: '/#services' },
        { label: 'Contact', href: '/contact' },
      ],
      cta: { label: 'Get in Touch', href: '/contact' },
    },
    defaultFooter: {
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
      legalLinks: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    },
    defaultSeo: {
      titleTemplate: '%s | Your Business',
      defaultDescription: 'A professional website for your business.',
      defaultOgImage: '/og-default.jpg',
    },
  },
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return templates.find((t) => t.id === id);
}

export function listTemplates(): TemplateDefinition[] {
  return templates;
}
