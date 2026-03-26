import type { CollectionConfig } from '@sonicjs-cms/core';

const pages: CollectionConfig = {
  name: 'pages',
  displayName: 'Pages',
  description: 'Static pages with a block-based page builder. Title = page title, slug = URL path.',
  icon: '📄',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      nav_label: {
        type: 'string',
        title: 'Navigation Label',
        helpText: 'Label shown in the site navigation (leave empty to hide from nav)',
      },
      layout: {
        type: 'select',
        title: 'Layout',
        enum: ['full-width', 'single-column', 'with-sidebar'],
        enumLabels: ['Full Width', 'Single Column (narrow)', 'With Sidebar'],
        default: 'single-column',
      },
      body: {
        type: 'array',
        title: 'Page Content',
        helpText: 'Add content blocks to build your page. Drag to reorder.',
        items: {
          type: 'object',
          discriminator: 'blockType',
          blocks: {
            hero: {
              label: 'Hero Section',
              description: 'Large heading with optional subheading and CTA',
              properties: {
                heading: { type: 'string', title: 'Heading', required: true },
                subheading: { type: 'textarea', title: 'Subheading' },
                cta_text: { type: 'string', title: 'Button Text' },
                cta_href: { type: 'url', title: 'Button Link' },
              },
            },
            text: {
              label: 'Text Block',
              description: 'Rich text content section',
              properties: {
                content: { type: 'quill', title: 'Content', required: true },
              },
            },
            features: {
              label: 'Features Grid',
              description: 'Grid of feature cards with titles and descriptions',
              properties: {
                heading: { type: 'string', title: 'Section Heading' },
                items: {
                  type: 'array',
                  title: 'Features',
                  items: {
                    type: 'object',
                    properties: {
                      icon: { type: 'string', title: 'Emoji Icon' },
                      title: { type: 'string', title: 'Title', required: true },
                      description: { type: 'textarea', title: 'Description' },
                    },
                  },
                },
              },
            },
            cta: {
              label: 'Call to Action',
              description: 'Highlighted CTA banner',
              properties: {
                heading: { type: 'string', title: 'Heading', required: true },
                text: { type: 'textarea', title: 'Description' },
                button_text: { type: 'string', title: 'Button Text' },
                button_href: { type: 'url', title: 'Button Link' },
              },
            },
            faq: {
              label: 'FAQ Section',
              description: 'Accordion-style frequently asked questions',
              properties: {
                heading: { type: 'string', title: 'Section Heading' },
                items: {
                  type: 'array',
                  title: 'Questions',
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string', title: 'Question', required: true },
                      answer: { type: 'textarea', title: 'Answer', required: true },
                    },
                  },
                },
              },
            },
            image: {
              label: 'Image',
              description: 'Single image with optional caption',
              properties: {
                src: { type: 'url', title: 'Image URL', required: true },
                alt: { type: 'string', title: 'Alt Text' },
                caption: { type: 'string', title: 'Caption' },
              },
            },
          },
        },
      },
      // SEO fields (auto-grouped under "SEO & Metadata" in admin)
      meta_title: { type: 'string', title: 'Meta Title', helpText: 'Overrides the page title for search engines' },
      meta_description: { type: 'textarea', title: 'Meta Description', maxLength: 160 },
    },
  },
  listFields: ['title', 'nav_label', 'layout'],
  searchFields: ['title', 'nav_label'],
  defaultSort: 'created_at',
};

export default pages;
