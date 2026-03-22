/**
 * Page Schema format for the visual editor.
 *
 * The schema is a JSON-serialisable description of a page's section
 * composition.  The visual editor reads and writes this format, and a
 * compiler regenerates the `.astro` file from it.
 *
 * **Critical rule:** The `.astro` files are always the source of truth for
 * the build system.  If the schema is deleted the site still builds.
 */

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export interface SectionSchema {
  /** Unique identifier within the page, e.g. "hero-1", "cta-2" */
  id: string;
  /** Component name as it appears in imports, e.g. "Hero", "CardGrid" */
  component: string;
  /** Component variant, e.g. "centered", "three-column" */
  variant?: string;
  /** Arbitrary component props (must be JSON-serialisable) */
  props: Record<string, unknown>;
  /** Background for the wrapping `<Section>` component */
  background?: 'light' | 'dark' | 'primary';
  /** Heading text for the wrapping `<Section>` component */
  heading?: string;
  /** Subheading text for the wrapping `<Section>` component */
  subheading?: string;
  /** HTML `id` attribute for the wrapping `<Section>` */
  sectionId?: string;
  /** Whether this component is a React island */
  isIsland?: boolean;
  /** Astro client directive for islands */
  clientDirective?: 'visible' | 'idle' | 'load';
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export interface PageSchema {
  /** Page filename without extension, e.g. "index", "about" */
  page: string;
  /** Page `<title>` value (plain string or config expression like "{config.seo.defaultTitle}") */
  title: string;
  /** Layout component name, e.g. "FullWidth", "SingleColumn" */
  layout: string;
  /** SEO metadata */
  seo: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
  /** Ordered list of page sections */
  sections: SectionSchema[];
  /** Directus collection names this page depends on, e.g. ["posts", "team_members"] */
  cmsCollections?: string[];
}
