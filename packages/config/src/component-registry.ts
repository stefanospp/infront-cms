// ---------------------------------------------------------------------------
// Component Registry
// Canonical source of truth for every shared UI component's props, variants,
// and metadata. Used by the admin wizard, template engine, and visual editor.
// ---------------------------------------------------------------------------

export interface PropDefinition {
  type:
    | 'text'
    | 'richtext'
    | 'url'
    | 'image'
    | 'boolean'
    | 'number'
    | 'select'
    | 'array'
    | 'color';
  label: string;
  required?: boolean;
  options?: string[]; // for 'select' type
  itemProps?: Record<string, PropDefinition>; // for 'array' type
}

export type ComponentCategory =
  | 'hero'
  | 'content'
  | 'cta'
  | 'navigation'
  | 'form'
  | 'media'
  | 'layout'
  | 'interactive'
  | 'footer'
  | 'testimonial'
  | 'team'
  | 'faq'
  | 'pricing'
  | 'stats'
  | 'timeline'
  | 'logo';

export interface ComponentDefinition {
  name: string;
  category: ComponentCategory;
  description: string;
  variants: string[];
  props: Record<string, PropDefinition>;
  isIsland?: boolean; // true for React islands
}

export const componentRegistry: Record<string, ComponentDefinition> = {
  // ---------------------------------------------------------------------------
  // Astro components — packages/ui/src/components/
  // ---------------------------------------------------------------------------

  Hero: {
    name: 'Hero',
    category: 'hero',
    description:
      'Full-width hero section with heading, subheading, CTA button, and optional background image or video.',
    variants: ['centered', 'split', 'fullscreen', 'minimal', 'video'],
    props: {
      variant: {
        type: 'select',
        label: 'Variant',
        required: true,
        options: ['centered', 'split', 'fullscreen', 'minimal', 'video'],
      },
      heading: {
        type: 'text',
        label: 'Heading',
        required: true,
      },
      subheading: {
        type: 'text',
        label: 'Subheading',
      },
      ctaText: {
        type: 'text',
        label: 'CTA Button Text',
      },
      ctaHref: {
        type: 'url',
        label: 'CTA Button Link',
      },
      backgroundImage: {
        type: 'image',
        label: 'Background Image',
      },
      backgroundVideo: {
        type: 'url',
        label: 'Background Video URL',
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  CTA: {
    name: 'CTA',
    category: 'cta',
    description:
      'Call-to-action banner with heading, description, and a prominent button. Available in default, split, and minimal layouts.',
    variants: ['default', 'split', 'minimal'],
    props: {
      variant: {
        type: 'select',
        label: 'Variant',
        options: ['default', 'split', 'minimal'],
      },
      heading: {
        type: 'text',
        label: 'Heading',
        required: true,
      },
      description: {
        type: 'text',
        label: 'Description',
      },
      buttonText: {
        type: 'text',
        label: 'Button Text',
        required: true,
      },
      buttonHref: {
        type: 'url',
        label: 'Button Link',
        required: true,
      },
      image: {
        type: 'image',
        label: 'Image (split variant)',
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  CardGrid: {
    name: 'CardGrid',
    category: 'content',
    description:
      'Responsive grid of cards with title, description, optional image, and optional link. Supports grid, masonry, and list layouts.',
    variants: ['two-column', 'three-column', 'four-column', 'masonry', 'list'],
    props: {
      variant: {
        type: 'select',
        label: 'Variant',
        required: true,
        options: ['two-column', 'three-column', 'four-column', 'masonry', 'list'],
      },
      cards: {
        type: 'array',
        label: 'Cards',
        required: true,
        itemProps: {
          title: {
            type: 'text',
            label: 'Title',
            required: true,
          },
          description: {
            type: 'text',
            label: 'Description',
            required: true,
          },
          image: {
            type: 'image',
            label: 'Image',
          },
          href: {
            type: 'url',
            label: 'Link',
          },
        },
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  ContactSection: {
    name: 'ContactSection',
    category: 'form',
    description:
      'Contact page section with an embedded ContactForm island, contact details (email, phone, address), and an optional map.',
    variants: [],
    props: {
      config: {
        type: 'text',
        label: 'Site Config',
        required: true,
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  FAQ: {
    name: 'FAQ',
    category: 'faq',
    description:
      'Accordion-style FAQ section with expandable question/answer pairs. Supports single-column and two-column layouts.',
    variants: ['default', 'two-column'],
    props: {
      variant: {
        type: 'select',
        label: 'Variant',
        options: ['default', 'two-column'],
      },
      items: {
        type: 'array',
        label: 'FAQ Items',
        required: true,
        itemProps: {
          question: {
            type: 'text',
            label: 'Question',
            required: true,
          },
          answer: {
            type: 'richtext',
            label: 'Answer',
            required: true,
          },
        },
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  Features: {
    name: 'Features',
    category: 'content',
    description:
      'Feature list showcasing capabilities with title, description, and optional icon or image. Grid, alternating, and icon-list layouts.',
    variants: ['grid', 'alternating', 'icon-list'],
    props: {
      variant: {
        type: 'select',
        label: 'Variant',
        options: ['grid', 'alternating', 'icon-list'],
      },
      features: {
        type: 'array',
        label: 'Features',
        required: true,
        itemProps: {
          title: {
            type: 'text',
            label: 'Title',
            required: true,
          },
          description: {
            type: 'text',
            label: 'Description',
            required: true,
          },
          icon: {
            type: 'text',
            label: 'Icon (emoji or character)',
          },
          image: {
            type: 'image',
            label: 'Image',
          },
        },
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  Footer: {
    name: 'Footer',
    category: 'footer',
    description:
      'Site footer with copyright text, legal links, and social icons. Style is controlled via theme.footerStyle in site config (simple, multi-column, minimal).',
    variants: ['simple', 'multi-column', 'minimal'],
    props: {
      config: {
        type: 'text',
        label: 'Site Config',
        required: true,
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  Gallery: {
    name: 'Gallery',
    category: 'media',
    description:
      'Image gallery with optional titles, descriptions, and links. Supports uniform grid and masonry layouts.',
    variants: ['grid', 'masonry'],
    props: {
      variant: {
        type: 'select',
        label: 'Variant',
        options: ['grid', 'masonry'],
      },
      items: {
        type: 'array',
        label: 'Gallery Items',
        required: true,
        itemProps: {
          image: {
            type: 'image',
            label: 'Image',
            required: true,
          },
          title: {
            type: 'text',
            label: 'Title',
          },
          description: {
            type: 'text',
            label: 'Description',
          },
          href: {
            type: 'url',
            label: 'Link',
          },
        },
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  LogoCloud: {
    name: 'LogoCloud',
    category: 'logo',
    description:
      'Displays partner or client logos in a static grid or auto-scrolling marquee.',
    variants: ['grid', 'scrolling'],
    props: {
      variant: {
        type: 'select',
        label: 'Variant',
        options: ['grid', 'scrolling'],
      },
      logos: {
        type: 'array',
        label: 'Logos',
        required: true,
        itemProps: {
          name: {
            type: 'text',
            label: 'Company Name',
            required: true,
          },
          image: {
            type: 'image',
            label: 'Logo Image',
            required: true,
          },
          href: {
            type: 'url',
            label: 'Link',
          },
        },
      },
      heading: {
        type: 'text',
        label: 'Heading',
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  Map: {
    name: 'Map',
    category: 'media',
    description:
      'Embedded Google Maps iframe showing a given address.',
    variants: [],
    props: {
      address: {
        type: 'text',
        label: 'Address',
        required: true,
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  Nav: {
    name: 'Nav',
    category: 'navigation',
    description:
      'Site header with logo, desktop navigation links, optional CTA button, and an embedded MobileNav island for small screens. Position controlled via theme.navStyle.',
    variants: [],
    props: {
      config: {
        type: 'text',
        label: 'Site Config',
        required: true,
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  OpeningHours: {
    name: 'OpeningHours',
    category: 'content',
    description:
      'Displays business opening hours in a day/hours table inside a card.',
    variants: [],
    props: {
      hours: {
        type: 'array',
        label: 'Hours',
        required: true,
        itemProps: {
          day: {
            type: 'text',
            label: 'Day',
            required: true,
          },
          hours: {
            type: 'text',
            label: 'Hours',
            required: true,
          },
        },
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  PricingTable: {
    name: 'PricingTable',
    category: 'pricing',
    description:
      'Pricing plan comparison with feature lists, CTA buttons, and an optional highlighted plan.',
    variants: ['two-column', 'three-column'],
    props: {
      variant: {
        type: 'select',
        label: 'Variant',
        options: ['two-column', 'three-column'],
      },
      plans: {
        type: 'array',
        label: 'Pricing Plans',
        required: true,
        itemProps: {
          name: {
            type: 'text',
            label: 'Plan Name',
            required: true,
          },
          price: {
            type: 'text',
            label: 'Price',
            required: true,
          },
          period: {
            type: 'text',
            label: 'Billing Period',
          },
          description: {
            type: 'text',
            label: 'Description',
          },
          features: {
            type: 'array',
            label: 'Features',
            required: true,
            itemProps: {
              value: {
                type: 'text',
                label: 'Feature',
                required: true,
              },
            },
          },
          ctaText: {
            type: 'text',
            label: 'CTA Button Text',
            required: true,
          },
          ctaHref: {
            type: 'url',
            label: 'CTA Button Link',
            required: true,
          },
          highlighted: {
            type: 'boolean',
            label: 'Highlighted (Popular)',
          },
        },
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  SEOHead: {
    name: 'SEOHead',
    category: 'layout',
    description:
      'Renders meta tags for SEO, Open Graph, canonical URL, structured data, and optional noindex directive.',
    variants: [],
    props: {
      title: {
        type: 'text',
        label: 'Page Title',
        required: true,
      },
      description: {
        type: 'text',
        label: 'Meta Description',
        required: true,
      },
      ogImage: {
        type: 'image',
        label: 'Open Graph Image',
      },
      ogType: {
        type: 'select',
        label: 'Open Graph Type',
        options: ['website', 'article'],
      },
      canonicalUrl: {
        type: 'url',
        label: 'Canonical URL',
      },
      noIndex: {
        type: 'boolean',
        label: 'No Index',
      },
      siteUrl: {
        type: 'url',
        label: 'Site URL',
        required: true,
      },
    },
  },

  Section: {
    name: 'Section',
    category: 'layout',
    description:
      'Generic page section wrapper with optional heading, subheading, background colour, and a slot for child components.',
    variants: ['light', 'dark', 'primary'],
    props: {
      heading: {
        type: 'text',
        label: 'Heading',
      },
      subheading: {
        type: 'text',
        label: 'Subheading',
      },
      background: {
        type: 'select',
        label: 'Background',
        options: ['light', 'dark', 'primary'],
      },
      id: {
        type: 'text',
        label: 'Section ID',
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  StatsCounter: {
    name: 'StatsCounter',
    category: 'stats',
    description:
      'Displays key metrics or statistics with numeric values, optional prefix/suffix, and labels.',
    variants: ['inline', 'grid'],
    props: {
      variant: {
        type: 'select',
        label: 'Variant',
        options: ['inline', 'grid'],
      },
      stats: {
        type: 'array',
        label: 'Stats',
        required: true,
        itemProps: {
          value: {
            type: 'text',
            label: 'Value',
            required: true,
          },
          label: {
            type: 'text',
            label: 'Label',
            required: true,
          },
          prefix: {
            type: 'text',
            label: 'Prefix',
          },
          suffix: {
            type: 'text',
            label: 'Suffix',
          },
        },
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  TeamGrid: {
    name: 'TeamGrid',
    category: 'team',
    description:
      'Team member grid with photo, name, role, optional bio, and email. Supports default cards, compact circles, and detailed rows.',
    variants: ['default', 'compact', 'detailed'],
    props: {
      variant: {
        type: 'select',
        label: 'Variant',
        options: ['default', 'compact', 'detailed'],
      },
      members: {
        type: 'array',
        label: 'Team Members',
        required: true,
        itemProps: {
          name: {
            type: 'text',
            label: 'Name',
            required: true,
          },
          role: {
            type: 'text',
            label: 'Role',
            required: true,
          },
          bio: {
            type: 'richtext',
            label: 'Bio',
          },
          photo: {
            type: 'image',
            label: 'Photo',
          },
          email: {
            type: 'text',
            label: 'Email',
          },
        },
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  Testimonials: {
    name: 'Testimonials',
    category: 'testimonial',
    description:
      'Customer testimonials with quote, author, optional role, and photo. Default grid, horizontal carousel, or single featured quote.',
    variants: ['default', 'carousel', 'featured'],
    props: {
      variant: {
        type: 'select',
        label: 'Variant',
        options: ['default', 'carousel', 'featured'],
      },
      testimonials: {
        type: 'array',
        label: 'Testimonials',
        required: true,
        itemProps: {
          quote: {
            type: 'richtext',
            label: 'Quote',
            required: true,
          },
          author: {
            type: 'text',
            label: 'Author',
            required: true,
          },
          role: {
            type: 'text',
            label: 'Role / Title',
          },
          image: {
            type: 'image',
            label: 'Author Photo',
          },
        },
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  Timeline: {
    name: 'Timeline',
    category: 'timeline',
    description:
      'Chronological timeline of events with year, title, and description. Vertical or alternating left-right layout.',
    variants: ['vertical', 'alternating'],
    props: {
      variant: {
        type: 'select',
        label: 'Variant',
        options: ['vertical', 'alternating'],
      },
      events: {
        type: 'array',
        label: 'Events',
        required: true,
        itemProps: {
          year: {
            type: 'text',
            label: 'Year',
            required: true,
          },
          title: {
            type: 'text',
            label: 'Title',
            required: true,
          },
          description: {
            type: 'richtext',
            label: 'Description',
            required: true,
          },
        },
      },
      class: {
        type: 'text',
        label: 'Additional CSS Classes',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // React islands — packages/ui/src/islands/
  // ---------------------------------------------------------------------------

  ContactForm: {
    name: 'ContactForm',
    category: 'form',
    description:
      'Interactive contact form with client-side validation, honeypot spam protection, and accessible error messages.',
    variants: [],
    props: {
      action: {
        type: 'url',
        label: 'Form Action URL',
      },
      successMessage: {
        type: 'text',
        label: 'Success Message',
      },
    },
    isIsland: true,
  },

  CookieConsent: {
    name: 'CookieConsent',
    category: 'interactive',
    description:
      'Cookie consent banner for Google Analytics. Stores preference in localStorage and conditionally loads the GA script.',
    variants: [],
    props: {
      analyticsProvider: {
        type: 'select',
        label: 'Analytics Provider',
        options: ['plausible', 'fathom', 'google'],
      },
      siteId: {
        type: 'text',
        label: 'Analytics Site / Measurement ID',
      },
    },
    isIsland: true,
  },

  MobileNav: {
    name: 'MobileNav',
    category: 'navigation',
    description:
      'Slide-in mobile navigation panel with focus trapping, scroll lock, and keyboard accessibility.',
    variants: [],
    props: {
      items: {
        type: 'array',
        label: 'Nav Items',
        required: true,
        itemProps: {
          label: {
            type: 'text',
            label: 'Label',
            required: true,
          },
          href: {
            type: 'url',
            label: 'Link',
            required: true,
          },
        },
      },
      cta: {
        type: 'array',
        label: 'CTA Button',
        itemProps: {
          label: {
            type: 'text',
            label: 'Label',
            required: true,
          },
          href: {
            type: 'url',
            label: 'Link',
            required: true,
          },
        },
      },
    },
    isIsland: true,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a single component by name. */
export function getComponent(name: string): ComponentDefinition | undefined {
  return componentRegistry[name];
}

/** List every component in a given category. */
export function listComponentsByCategory(
  category: ComponentCategory,
): ComponentDefinition[] {
  return Object.values(componentRegistry).filter((c) => c.category === category);
}

/** List only Astro components (not React islands). */
export function listAstroComponents(): ComponentDefinition[] {
  return Object.values(componentRegistry).filter((c) => !c.isIsland);
}

/** List only React island components. */
export function listIslandComponents(): ComponentDefinition[] {
  return Object.values(componentRegistry).filter((c) => !!c.isIsland);
}

/** List every component that exposes at least one variant. */
export function listComponentsWithVariants(): ComponentDefinition[] {
  return Object.values(componentRegistry).filter((c) => c.variants.length > 0);
}

/** Get the available variant options for a component, or an empty array. */
export function getComponentVariants(name: string): string[] {
  return componentRegistry[name]?.variants ?? [];
}
