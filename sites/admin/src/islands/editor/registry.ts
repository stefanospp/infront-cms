// ---------------------------------------------------------------------------
// Re-export component registry for use in the visual editor React islands.
// ---------------------------------------------------------------------------

export {
  componentRegistry,
  getComponent,
  listComponentsByCategory,
} from '@agency/config';

export type {
  PropDefinition,
  ComponentDefinition,
  ComponentCategory,
} from '@agency/config';

export type { SectionSchema, PageSchema } from '@agency/config';

// ---------------------------------------------------------------------------
// Editor helpers
// ---------------------------------------------------------------------------

/** Generate a unique section ID for the editor */
export function generateSectionId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Component categories for the "Add Section" modal */
export const componentCategories: { id: string; label: string }[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'content', label: 'Content' },
  { id: 'cta', label: 'Call to Action' },
  { id: 'form', label: 'Forms' },
  { id: 'media', label: 'Media' },
  { id: 'testimonial', label: 'Testimonials' },
  { id: 'team', label: 'Team' },
  { id: 'faq', label: 'FAQ' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'stats', label: 'Stats' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'logo', label: 'Logos' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'footer', label: 'Footer' },
  { id: 'layout', label: 'Layout' },
  { id: 'interactive', label: 'Interactive' },
];
