import type { TemplateDefinition } from './types.js';

export const templates: TemplateDefinition[] = [
  {
    id: 'business-starter',
    name: 'Business Starter',
    description:
      'Clean, professional template for service businesses. Includes home, about, contact, privacy, and terms pages with a modern blue palette.',
    screenshot: '/templates/business-starter.png',
    category: 'business',
    features: ['Contact form', 'Testimonials', 'Team page', 'SEO optimised'],
    pages: [
      {
        slug: 'index',
        title: '{config.seo.defaultTitle}',
        description: '{config.seo.defaultDescription}',
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
            children: [
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
            ],
          },
          {
            component: 'Section',
            props: { background: 'light' },
            children: [
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
            ],
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
        title: 'About Us',
        description: 'Learn more about our team and our approach.',
        layout: 'SingleColumn',
        sections: [
          {
            component: 'Section',
            props: { heading: 'Our Team', background: 'light' },
            children: [
              {
                component: 'TeamGrid',
                props: {
                  members: [
                    { name: 'Team Member', role: 'Founder', bio: 'Short bio here.' },
                  ],
                },
              },
            ],
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
        title: 'Contact Us',
        description: 'Get in touch with us. We\'d love to hear from you.',
        layout: 'SingleColumn',
        sections: [
          { component: 'ContactSection', props: {} },
        ],
      },
      {
        slug: 'privacy',
        title: 'Privacy Policy',
        description: 'Our privacy policy and how we handle your data.',
        layout: 'SingleColumn',
        sections: [],
      },
      {
        slug: 'terms',
        title: 'Terms of Service',
        description: 'Our terms and conditions of service.',
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

  // -------------------------------------------------------------------------
  // Restaurant
  // -------------------------------------------------------------------------
  {
    id: 'restaurant',
    name: 'Restaurant',
    description:
      'Warm, inviting template for restaurants and cafés. Fullscreen hero, menu highlights, opening hours, and reservation CTA.',
    screenshot: '/templates/restaurant.png',
    category: 'hospitality',
    features: ['Menu page', 'Opening hours', 'Reservation CTA', 'Fullscreen hero'],
    pages: [
      {
        slug: 'index',
        title: '{config.seo.defaultTitle}',
        description: '{config.seo.defaultDescription}',
        layout: 'FullWidth',
        sections: [
          {
            component: 'Hero',
            variant: 'fullscreen',
            props: {
              heading: 'Welcome to Our Restaurant',
              subheading: 'Experience exceptional cuisine in an unforgettable setting.',
              ctaText: 'Reserve a Table',
              ctaHref: '/contact',
              backgroundImage: '/images/hero.jpg',
            },
          },
          {
            component: 'Section',
            props: { heading: 'Our Menu', subheading: 'Chef\'s favourites' },
            children: [
              {
                component: 'CardGrid',
                variant: 'three-column',
                props: {
                  cards: [
                    { title: 'Starters', description: 'Fresh seasonal ingredients prepared with care.', href: '/menu' },
                    { title: 'Main Courses', description: 'Signature dishes crafted by our head chef.', href: '/menu' },
                    { title: 'Desserts', description: 'Indulgent sweets to complete your meal.', href: '/menu' },
                  ],
                },
              },
            ],
          },
          {
            component: 'Section',
            props: { background: 'light' },
            children: [
              {
                component: 'Testimonials',
                variant: 'featured',
                props: {
                  testimonials: [
                    { quote: 'An incredible dining experience from start to finish. The food was outstanding and the atmosphere was perfect.', author: 'Guest Name', role: 'Local Guide' },
                  ],
                },
              },
            ],
          },
          {
            component: 'CTA',
            props: {
              heading: 'Make a Reservation',
              description: 'Book your table for an unforgettable dining experience.',
              buttonText: 'Reserve Now',
              buttonHref: '/contact',
            },
          },
        ],
      },
      {
        slug: 'menu',
        title: 'Menu',
        description: 'Browse our full menu of starters, mains, and desserts.',
        layout: 'SingleColumn',
        sections: [
          {
            component: 'Section',
            props: { heading: 'Starters' },
            children: [
              {
                component: 'CardGrid',
                variant: 'list',
                props: {
                  cards: [
                    { title: 'Seasonal Soup', description: 'Made fresh daily with local ingredients.' },
                    { title: 'Bruschetta', description: 'Toasted sourdough with vine tomatoes and basil.' },
                    { title: 'Cured Salmon', description: 'House-cured salmon with dill and capers.' },
                  ],
                },
              },
            ],
          },
          {
            component: 'Section',
            props: { heading: 'Main Courses', background: 'light' },
            children: [
              {
                component: 'CardGrid',
                variant: 'list',
                props: {
                  cards: [
                    { title: 'Grilled Sea Bass', description: 'Pan-seared with lemon butter and seasonal vegetables.' },
                    { title: 'Slow-Roasted Lamb', description: 'Twelve-hour lamb shoulder with rosemary jus.' },
                    { title: 'Wild Mushroom Risotto', description: 'Arborio rice with foraged mushrooms and parmesan.' },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        slug: 'about',
        title: 'About Us',
        description: 'Our story and the team behind the kitchen.',
        layout: 'SingleColumn',
        sections: [
          {
            component: 'Section',
            props: { heading: 'Our Team', background: 'light' },
            children: [
              {
                component: 'TeamGrid',
                props: {
                  members: [
                    { name: 'Head Chef', role: 'Executive Chef', bio: 'Bringing 20 years of culinary excellence.' },
                  ],
                },
              },
            ],
          },
          {
            component: 'Section',
            props: {},
            children: [
              {
                component: 'OpeningHours',
                props: {
                  hours: [
                    { day: 'Monday', hours: 'Closed' },
                    { day: 'Tuesday - Friday', hours: '12:00 - 22:00' },
                    { day: 'Saturday', hours: '11:00 - 23:00' },
                    { day: 'Sunday', hours: '11:00 - 21:00' },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        slug: 'contact',
        title: 'Contact & Reservations',
        description: 'Make a reservation or get in touch with us.',
        layout: 'SingleColumn',
        sections: [
          { component: 'ContactSection', props: {} },
        ],
      },
      { slug: 'privacy', title: 'Privacy Policy', description: 'Our privacy policy.', layout: 'SingleColumn', sections: [] },
      { slug: 'terms', title: 'Terms of Service', description: 'Our terms.', layout: 'SingleColumn', sections: [] },
    ],
    defaultTheme: {
      navStyle: 'fixed',
      footerStyle: 'multi-column',
      heroDefault: 'fullscreen',
      borderStyle: 'rounded',
    },
    defaultTokens: {
      colors: {
        primary: {
          50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
          400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
          800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
        },
        secondary: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f', 950: '#451a03',
        },
        accent: {
          50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047',
          400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207',
          800: '#854d0e', 900: '#713f12', 950: '#422006',
        },
        neutral: {
          50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1',
          400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c',
          800: '#292524', 900: '#1c1917', 950: '#0c0a09',
        },
      },
      fonts: { heading: 'Playfair Display', body: 'Lato' },
    },
    defaultNav: {
      items: [
        { label: 'Menu', href: '/menu' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
      cta: { label: 'Reserve a Table', href: '/contact' },
    },
    defaultFooter: {
      columns: [
        {
          title: 'Visit',
          links: [
            { label: 'Menu', href: '/menu' },
            { label: 'About Us', href: '/about' },
            { label: 'Reservations', href: '/contact' },
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
      titleTemplate: '%s | Our Restaurant',
      defaultDescription: 'Exceptional cuisine in an unforgettable setting.',
      defaultOgImage: '/og-default.jpg',
    },
  },

  // -------------------------------------------------------------------------
  // Portfolio / Creative
  // -------------------------------------------------------------------------
  {
    id: 'portfolio',
    name: 'Portfolio',
    description:
      'Minimal, image-forward template for creatives and freelancers. Gallery grid, timeline, and a clean aesthetic.',
    screenshot: '/templates/portfolio.png',
    category: 'creative',
    features: ['Gallery grid', 'Timeline', 'Minimal design', 'Image-forward'],
    pages: [
      {
        slug: 'index',
        title: '{config.seo.defaultTitle}',
        description: '{config.seo.defaultDescription}',
        layout: 'FullWidth',
        sections: [
          {
            component: 'Hero',
            variant: 'minimal',
            props: {
              heading: 'Design & Development',
              subheading: 'Crafting digital experiences that stand out.',
            },
          },
          {
            component: 'Section',
            props: { heading: 'Selected Work' },
            children: [
              {
                component: 'Gallery',
                variant: 'grid',
                props: {
                  items: [
                    { image: '/images/work-1.jpg', title: 'Project One', href: '/work' },
                    { image: '/images/work-2.jpg', title: 'Project Two', href: '/work' },
                    { image: '/images/work-3.jpg', title: 'Project Three', href: '/work' },
                  ],
                },
              },
            ],
          },
          {
            component: 'CTA',
            variant: 'minimal',
            props: {
              heading: 'Have a project in mind?',
              description: 'Let\'s create something great together.',
              buttonText: 'Get in Touch',
              buttonHref: '/contact',
            },
          },
        ],
      },
      {
        slug: 'work',
        title: 'Work',
        description: 'A showcase of selected projects and case studies.',
        layout: 'FullWidth',
        sections: [
          {
            component: 'Section',
            props: { heading: 'All Projects' },
            children: [
              {
                component: 'Gallery',
                variant: 'masonry',
                props: {
                  items: [
                    { image: '/images/work-1.jpg', title: 'Project One', description: 'Brand identity and web design.' },
                    { image: '/images/work-2.jpg', title: 'Project Two', description: 'E-commerce platform redesign.' },
                    { image: '/images/work-3.jpg', title: 'Project Three', description: 'Mobile app UI/UX.' },
                    { image: '/images/work-4.jpg', title: 'Project Four', description: 'Marketing website.' },
                    { image: '/images/work-5.jpg', title: 'Project Five', description: 'Product design system.' },
                    { image: '/images/work-6.jpg', title: 'Project Six', description: 'Interactive editorial.' },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        slug: 'about',
        title: 'About',
        description: 'Background and experience.',
        layout: 'SingleColumn',
        sections: [
          {
            component: 'Section',
            props: { heading: 'Experience' },
            children: [
              {
                component: 'Timeline',
                variant: 'vertical',
                props: {
                  events: [
                    { year: '2024', title: 'Independent Studio', description: 'Launched own design studio focusing on digital products.' },
                    { year: '2020', title: 'Senior Designer, Agency X', description: 'Led design for enterprise clients across fintech and healthcare.' },
                    { year: '2017', title: 'Designer, Startup Y', description: 'Early design hire building the product from zero to launch.' },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        slug: 'contact',
        title: 'Contact',
        description: 'Get in touch for project enquiries.',
        layout: 'SingleColumn',
        sections: [
          { component: 'ContactSection', props: {} },
        ],
      },
      { slug: 'privacy', title: 'Privacy Policy', description: 'Our privacy policy.', layout: 'SingleColumn', sections: [] },
      { slug: 'terms', title: 'Terms of Service', description: 'Our terms.', layout: 'SingleColumn', sections: [] },
    ],
    defaultTheme: {
      navStyle: 'sticky',
      footerStyle: 'minimal',
      heroDefault: 'minimal',
      borderStyle: 'sharp',
    },
    defaultTokens: {
      colors: {
        primary: {
          50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4',
          400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040',
          800: '#262626', 900: '#171717', 950: '#0a0a0a',
        },
        secondary: {
          50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4',
          400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040',
          800: '#262626', 900: '#171717', 950: '#0a0a0a',
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
      fonts: { heading: 'Space Grotesk', body: 'DM Sans' },
    },
    defaultNav: {
      items: [
        { label: 'Work', href: '/work' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    defaultFooter: {
      columns: [],
      legalLinks: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
      ],
    },
    defaultSeo: {
      titleTemplate: '%s | Portfolio',
      defaultDescription: 'Design and development portfolio.',
      defaultOgImage: '/og-default.jpg',
    },
  },

  // -------------------------------------------------------------------------
  // SaaS / Startup
  // -------------------------------------------------------------------------
  {
    id: 'saas',
    name: 'SaaS',
    description:
      'Modern template for SaaS products and startups. Split hero, features grid, pricing table, FAQ, and social proof.',
    screenshot: '/templates/saas.png',
    category: 'technology',
    features: ['Pricing table', 'Features grid', 'FAQ', 'Social proof'],
    pages: [
      {
        slug: 'index',
        title: '{config.seo.defaultTitle}',
        description: '{config.seo.defaultDescription}',
        layout: 'FullWidth',
        sections: [
          {
            component: 'Hero',
            variant: 'split',
            props: {
              heading: 'Ship faster with our platform',
              subheading: 'The all-in-one tool that helps teams build, ship, and iterate on great products.',
              ctaText: 'Start Free Trial',
              ctaHref: '/contact',
              backgroundImage: '/images/product-screenshot.png',
            },
          },
          {
            component: 'Section',
            props: { background: 'light' },
            children: [
              {
                component: 'LogoCloud',
                props: {
                  heading: 'Trusted by teams at',
                  logos: [
                    { name: 'Company A', image: '/images/logo-a.svg' },
                    { name: 'Company B', image: '/images/logo-b.svg' },
                    { name: 'Company C', image: '/images/logo-c.svg' },
                    { name: 'Company D', image: '/images/logo-d.svg' },
                  ],
                },
              },
            ],
          },
          {
            component: 'Section',
            props: { heading: 'Everything you need', subheading: 'Built for modern teams' },
            children: [
              {
                component: 'Features',
                variant: 'grid',
                props: {
                  features: [
                    { title: 'Fast Setup', description: 'Get started in minutes, not weeks. No complex configuration required.' },
                    { title: 'Team Collaboration', description: 'Real-time editing and commenting for your entire team.' },
                    { title: 'Analytics', description: 'Understand how your product is performing with built-in insights.' },
                    { title: 'Integrations', description: 'Connect with the tools you already use — Slack, GitHub, Jira, and more.' },
                    { title: 'Security', description: 'Enterprise-grade security with SOC 2 compliance and SSO.' },
                    { title: 'Support', description: 'Dedicated support team available to help whenever you need it.' },
                  ],
                },
              },
            ],
          },
          {
            component: 'Section',
            props: { heading: 'Simple, transparent pricing', background: 'light' },
            children: [
              {
                component: 'PricingTable',
                variant: 'three-column',
                props: {
                  plans: [
                    {
                      name: 'Starter',
                      price: '$19',
                      period: 'month',
                      description: 'For individuals and small projects.',
                      features: ['Up to 3 projects', '1 team member', 'Basic analytics', 'Email support'],
                      ctaText: 'Get Started',
                      ctaHref: '/contact',
                    },
                    {
                      name: 'Pro',
                      price: '$49',
                      period: 'month',
                      description: 'For growing teams that need more.',
                      features: ['Unlimited projects', 'Up to 10 members', 'Advanced analytics', 'Priority support', 'Integrations'],
                      ctaText: 'Start Free Trial',
                      ctaHref: '/contact',
                      highlighted: true,
                    },
                    {
                      name: 'Enterprise',
                      price: 'Custom',
                      description: 'For large organisations with custom needs.',
                      features: ['Everything in Pro', 'Unlimited members', 'SSO & SAML', 'Dedicated account manager', 'SLA guarantee'],
                      ctaText: 'Contact Sales',
                      ctaHref: '/contact',
                    },
                  ],
                },
              },
            ],
          },
          {
            component: 'Section',
            props: { heading: 'What our customers say' },
            children: [
              {
                component: 'Testimonials',
                props: {
                  testimonials: [
                    { quote: 'This platform cut our development time in half. The team collaboration features are game-changing.', author: 'CTO Name', role: 'CTO, Tech Co' },
                    { quote: 'We evaluated five different tools. This was the only one our entire team actually wanted to use.', author: 'PM Name', role: 'Product Manager, Startup' },
                    { quote: 'The best investment we made this year. ROI was clear within the first month.', author: 'Founder Name', role: 'Founder, Agency' },
                  ],
                },
              },
            ],
          },
          {
            component: 'Section',
            props: { heading: 'Frequently Asked Questions', background: 'light' },
            children: [
              {
                component: 'FAQ',
                props: {
                  items: [
                    { question: 'How long is the free trial?', answer: '14 days, no credit card required. You can upgrade at any time during or after the trial.' },
                    { question: 'Can I change plans later?', answer: 'Yes, you can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.' },
                    { question: 'Is there a setup fee?', answer: 'No, there are no setup fees or hidden charges. You only pay the monthly or annual subscription.' },
                    { question: 'Do you offer refunds?', answer: 'Yes, we offer a 30-day money-back guarantee on all plans.' },
                  ],
                },
              },
            ],
          },
          {
            component: 'CTA',
            props: {
              heading: 'Ready to get started?',
              description: 'Start your free trial today. No credit card required.',
              buttonText: 'Start Free Trial',
              buttonHref: '/contact',
            },
          },
        ],
      },
      {
        slug: 'features',
        title: 'Features',
        description: 'Explore all platform features in detail.',
        layout: 'FullWidth',
        sections: [
          {
            component: 'Section',
            props: { heading: 'Platform Features', subheading: 'Everything you need to build great products' },
            children: [
              {
                component: 'Features',
                variant: 'alternating',
                props: {
                  features: [
                    { title: 'Real-Time Collaboration', description: 'Work together with your team in real time. See changes as they happen, leave comments, and resolve feedback — all in one place.', image: '/images/feature-collab.png' },
                    { title: 'Powerful Analytics', description: 'Track usage, performance, and engagement with dashboards that update in real time. Export reports and share insights with stakeholders.', image: '/images/feature-analytics.png' },
                    { title: 'Seamless Integrations', description: 'Connect your existing tools — Slack, GitHub, Jira, Linear, and more. Automate workflows and keep everything in sync.', image: '/images/feature-integrations.png' },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        slug: 'pricing',
        title: 'Pricing',
        description: 'Simple, transparent pricing for every team size.',
        layout: 'FullWidth',
        sections: [
          {
            component: 'Section',
            props: { heading: 'Pricing', subheading: 'Choose the plan that fits your team' },
            children: [
              {
                component: 'PricingTable',
                variant: 'three-column',
                props: {
                  plans: [
                    {
                      name: 'Starter',
                      price: '$19',
                      period: 'month',
                      features: ['Up to 3 projects', '1 team member', 'Basic analytics', 'Email support'],
                      ctaText: 'Get Started',
                      ctaHref: '/contact',
                    },
                    {
                      name: 'Pro',
                      price: '$49',
                      period: 'month',
                      features: ['Unlimited projects', 'Up to 10 members', 'Advanced analytics', 'Priority support', 'Integrations'],
                      ctaText: 'Start Free Trial',
                      ctaHref: '/contact',
                      highlighted: true,
                    },
                    {
                      name: 'Enterprise',
                      price: 'Custom',
                      features: ['Everything in Pro', 'Unlimited members', 'SSO & SAML', 'Dedicated account manager', 'SLA guarantee'],
                      ctaText: 'Contact Sales',
                      ctaHref: '/contact',
                    },
                  ],
                },
              },
            ],
          },
          {
            component: 'Section',
            props: { heading: 'FAQ', background: 'light' },
            children: [
              {
                component: 'FAQ',
                variant: 'two-column',
                props: {
                  items: [
                    { question: 'How long is the free trial?', answer: '14 days, no credit card required.' },
                    { question: 'Can I change plans later?', answer: 'Yes, upgrade or downgrade at any time.' },
                    { question: 'Is there a setup fee?', answer: 'No setup fees or hidden charges.' },
                    { question: 'Do you offer refunds?', answer: '30-day money-back guarantee on all plans.' },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        slug: 'about',
        title: 'About',
        description: 'Meet the team building the platform.',
        layout: 'SingleColumn',
        sections: [
          {
            component: 'Section',
            props: {},
            children: [
              {
                component: 'StatsCounter',
                variant: 'inline',
                props: {
                  stats: [
                    { value: '10K', suffix: '+', label: 'Active Users' },
                    { value: '99.9', suffix: '%', label: 'Uptime' },
                    { value: '50', suffix: '+', label: 'Integrations' },
                    { value: '4.9', label: 'Rating' },
                  ],
                },
              },
            ],
          },
          {
            component: 'Section',
            props: { heading: 'Our Team', background: 'light' },
            children: [
              {
                component: 'TeamGrid',
                props: {
                  members: [
                    { name: 'Founder Name', role: 'CEO & Co-Founder', bio: 'Previously at Big Tech Co.' },
                    { name: 'CTO Name', role: 'CTO & Co-Founder', bio: 'Built systems serving millions.' },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        slug: 'contact',
        title: 'Contact',
        description: 'Get in touch with our team.',
        layout: 'SingleColumn',
        sections: [
          { component: 'ContactSection', props: {} },
        ],
      },
      { slug: 'privacy', title: 'Privacy Policy', description: 'Our privacy policy.', layout: 'SingleColumn', sections: [] },
      { slug: 'terms', title: 'Terms of Service', description: 'Our terms.', layout: 'SingleColumn', sections: [] },
    ],
    defaultTheme: {
      navStyle: 'sticky',
      footerStyle: 'multi-column',
      heroDefault: 'split',
      borderStyle: 'rounded',
    },
    defaultTokens: {
      colors: {
        primary: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
          800: '#3730a3', 900: '#312e81', 950: '#1e1b4b',
        },
        secondary: {
          50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9',
          400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490',
          800: '#155e75', 900: '#164e63', 950: '#083344',
        },
        accent: {
          50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
          400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
          800: '#115e59', 900: '#134e4a', 950: '#042f2e',
        },
        neutral: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
          400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
          800: '#1e293b', 900: '#0f172a', 950: '#020617',
        },
      },
      fonts: { heading: 'Plus Jakarta Sans', body: 'Inter' },
    },
    defaultNav: {
      items: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
      cta: { label: 'Start Free Trial', href: '/contact' },
    },
    defaultFooter: {
      columns: [
        {
          title: 'Product',
          links: [
            { label: 'Features', href: '/features' },
            { label: 'Pricing', href: '/pricing' },
          ],
        },
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
      titleTemplate: '%s | Product Name',
      defaultDescription: 'The all-in-one platform for modern teams.',
      defaultOgImage: '/og-default.jpg',
    },
  },

  // -------------------------------------------------------------------------
  // Professional Services
  // -------------------------------------------------------------------------
  {
    id: 'professional',
    name: 'Professional',
    description:
      'Authoritative template for professional service firms. Stats, case studies, team showcase, and trust-building design.',
    screenshot: '/templates/professional.png',
    category: 'services',
    features: ['Stats counter', 'Case studies', 'Logo cloud', 'Timeline'],
    pages: [
      {
        slug: 'index',
        title: '{config.seo.defaultTitle}',
        description: '{config.seo.defaultDescription}',
        layout: 'FullWidth',
        sections: [
          {
            component: 'Hero',
            variant: 'centered',
            props: {
              heading: 'Expert guidance for your business',
              subheading: 'We help organisations navigate complexity with clarity and confidence.',
              ctaText: 'Book a Consultation',
              ctaHref: '/contact',
            },
          },
          {
            component: 'Section',
            props: {},
            children: [
              {
                component: 'StatsCounter',
                variant: 'grid',
                props: {
                  stats: [
                    { value: '25', suffix: '+', label: 'Years Experience' },
                    { value: '500', suffix: '+', label: 'Clients Served' },
                    { value: '98', suffix: '%', label: 'Client Satisfaction' },
                    { value: '12', label: 'Industry Awards' },
                  ],
                },
              },
            ],
          },
          {
            component: 'Section',
            props: { heading: 'Our Services', subheading: 'How we can help' },
            children: [
              {
                component: 'CardGrid',
                variant: 'three-column',
                props: {
                  cards: [
                    { title: 'Consulting', description: 'Strategic advice tailored to your industry and business goals.', href: '/services' },
                    { title: 'Advisory', description: 'Ongoing guidance to help you make informed decisions.', href: '/services' },
                    { title: 'Implementation', description: 'Hands-on support to execute strategies effectively.', href: '/services' },
                  ],
                },
              },
            ],
          },
          {
            component: 'Section',
            props: { background: 'light' },
            children: [
              {
                component: 'Testimonials',
                props: {
                  testimonials: [
                    { quote: 'Their expertise saved us months of trial and error. A true partner in every sense.', author: 'CEO Name', role: 'CEO, Enterprise Co' },
                    { quote: 'Professional, thorough, and always available when we needed them most.', author: 'CFO Name', role: 'CFO, Growth Co' },
                    { quote: 'The ROI from their engagement was clear within the first quarter.', author: 'COO Name', role: 'COO, Scale Co' },
                  ],
                },
              },
            ],
          },
          {
            component: 'Section',
            props: {},
            children: [
              {
                component: 'LogoCloud',
                variant: 'grid',
                props: {
                  heading: 'Trusted by leading organisations',
                  logos: [
                    { name: 'Client A', image: '/images/client-a.svg' },
                    { name: 'Client B', image: '/images/client-b.svg' },
                    { name: 'Client C', image: '/images/client-c.svg' },
                    { name: 'Client D', image: '/images/client-d.svg' },
                    { name: 'Client E', image: '/images/client-e.svg' },
                  ],
                },
              },
            ],
          },
          {
            component: 'CTA',
            props: {
              heading: 'Ready to talk?',
              description: 'Schedule a no-obligation consultation with our team.',
              buttonText: 'Book a Consultation',
              buttonHref: '/contact',
            },
          },
        ],
      },
      {
        slug: 'services',
        title: 'Services',
        description: 'Our range of professional services.',
        layout: 'FullWidth',
        sections: [
          {
            component: 'Section',
            props: { heading: 'What We Offer', subheading: 'Comprehensive services for every stage' },
            children: [
              {
                component: 'Features',
                variant: 'icon-list',
                props: {
                  features: [
                    { title: 'Strategy Consulting', description: 'Define your path forward with data-driven strategy and market analysis.' },
                    { title: 'Business Advisory', description: 'Ongoing guidance on operations, finance, and growth.' },
                    { title: 'Digital Transformation', description: 'Modernise processes and technology to stay competitive.' },
                    { title: 'Risk Management', description: 'Identify and mitigate risks before they become problems.' },
                  ],
                },
              },
            ],
          },
          {
            component: 'Section',
            props: { heading: 'Common Questions', background: 'light' },
            children: [
              {
                component: 'FAQ',
                props: {
                  items: [
                    { question: 'How do engagements typically work?', answer: 'We start with a discovery session to understand your needs, then propose a tailored engagement model.' },
                    { question: 'What industries do you serve?', answer: 'We have deep experience across financial services, technology, healthcare, and professional services.' },
                    { question: 'What is your pricing model?', answer: 'We offer both project-based and retainer pricing depending on scope and duration.' },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        slug: 'case-studies',
        title: 'Case Studies',
        description: 'Real results from real engagements.',
        layout: 'FullWidth',
        sections: [
          {
            component: 'Section',
            props: { heading: 'Case Studies', subheading: 'See how we\'ve helped organisations like yours' },
            children: [
              {
                component: 'CardGrid',
                variant: 'two-column',
                props: {
                  cards: [
                    { title: 'Enterprise Transformation', description: 'How we helped a Fortune 500 company modernise their operations and reduce costs by 30%.', href: '/contact' },
                    { title: 'Startup Scale-Up', description: 'Supporting a Series B startup in scaling from 20 to 200 employees while maintaining culture.', href: '/contact' },
                    { title: 'Market Entry Strategy', description: 'Guiding a European firm through successful expansion into the North American market.', href: '/contact' },
                    { title: 'Digital Overhaul', description: 'Redesigning legacy systems for a financial services firm, improving processing speed by 5x.', href: '/contact' },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        slug: 'about',
        title: 'About',
        description: 'Our firm, our history, and the team.',
        layout: 'SingleColumn',
        sections: [
          {
            component: 'Section',
            props: { heading: 'Our Journey' },
            children: [
              {
                component: 'Timeline',
                variant: 'alternating',
                props: {
                  events: [
                    { year: '2000', title: 'Founded', description: 'Started as a two-person consulting practice.' },
                    { year: '2010', title: 'National Expansion', description: 'Opened offices in three major cities.' },
                    { year: '2018', title: 'Global Reach', description: 'First international engagement, now serving clients in 15 countries.' },
                    { year: '2024', title: 'Industry Recognition', description: 'Named Top 50 consulting firm by Industry Publication.' },
                  ],
                },
              },
            ],
          },
          {
            component: 'Section',
            props: { heading: 'Leadership Team', background: 'light' },
            children: [
              {
                component: 'TeamGrid',
                variant: 'detailed',
                props: {
                  members: [
                    { name: 'Managing Partner', role: 'Managing Partner', bio: '25 years of experience in strategy consulting across financial services and technology.' },
                    { name: 'Senior Partner', role: 'Head of Advisory', bio: 'Former CFO with deep expertise in business transformation and M&A.' },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        slug: 'contact',
        title: 'Contact',
        description: 'Schedule a consultation with our team.',
        layout: 'SingleColumn',
        sections: [
          { component: 'ContactSection', props: {} },
        ],
      },
      { slug: 'privacy', title: 'Privacy Policy', description: 'Our privacy policy.', layout: 'SingleColumn', sections: [] },
      { slug: 'terms', title: 'Terms of Service', description: 'Our terms.', layout: 'SingleColumn', sections: [] },
    ],
    defaultTheme: {
      navStyle: 'sticky',
      footerStyle: 'multi-column',
      heroDefault: 'centered',
      borderStyle: 'sharp',
    },
    defaultTokens: {
      colors: {
        primary: {
          50: '#f0f4ff', 100: '#dbe4fe', 200: '#bfcffc', 300: '#93aef8',
          400: '#6085f2', 500: '#3b5eea', 600: '#2541df', 700: '#1d33cc',
          800: '#1e2ca6', 900: '#1e2b83', 950: '#161c50',
        },
        secondary: {
          50: '#f6f7f9', 100: '#eceef2', 200: '#d5d9e2', 300: '#b1bac8',
          400: '#8793aa', 500: '#68768f', 600: '#535f77', 700: '#444e61',
          800: '#3b4352', 900: '#343a46', 950: '#23272f',
        },
        accent: {
          50: '#fdfbef', 100: '#faf3d0', 200: '#f4e49e', 300: '#edcf63',
          400: '#e7bc3c', 500: '#dea225', 600: '#c47f1a', 700: '#a35d18',
          800: '#864a1b', 900: '#6f3d19', 950: '#401f0a',
        },
        neutral: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
          400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
          800: '#1e293b', 900: '#0f172a', 950: '#020617',
        },
      },
      fonts: { heading: 'Merriweather', body: 'Source Sans Pro' },
    },
    defaultNav: {
      items: [
        { label: 'Services', href: '/services' },
        { label: 'Case Studies', href: '/case-studies' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
      cta: { label: 'Book a Consultation', href: '/contact' },
    },
    defaultFooter: {
      columns: [
        {
          title: 'Services',
          links: [
            { label: 'Consulting', href: '/services' },
            { label: 'Advisory', href: '/services' },
          ],
        },
        {
          title: 'Firm',
          links: [
            { label: 'About', href: '/about' },
            { label: 'Case Studies', href: '/case-studies' },
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
      titleTemplate: '%s | Firm Name',
      defaultDescription: 'Expert guidance for your business.',
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
