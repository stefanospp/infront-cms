export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface NavCTA {
  label: string;
  href: string;
}

export interface NavConfig {
  items: NavItem[];
  cta?: NavCTA;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
}

export interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string }>;
}

export interface FooterConfig {
  columns: FooterColumn[];
  socials?: SocialLinks;
  legalLinks: Array<{ label: string; href: string }>;
  text?: string;
}

export interface AddressConfig {
  street: string;
  city: string;
  postcode: string;
  country: string;
  region?: string;
}

export interface ContactConfig {
  email: string;
  phone?: string;
  address?: AddressConfig;
}

export interface SEOConfig {
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultOgImage: string;
  structuredData?: {
    type: string;
    [key: string]: unknown;
  };
}

export interface AnalyticsConfig {
  provider: 'plausible' | 'fathom' | 'google';
  siteId: string;
}

export interface CMSConfig {
  url: string;
}

export interface ThemeConfig {
  navStyle: 'sticky' | 'fixed' | 'static';
  footerStyle: 'simple' | 'multi-column' | 'minimal';
  heroDefault: 'centered' | 'split' | 'fullscreen' | 'minimal';
  borderStyle: 'sharp' | 'rounded' | 'pill';
}

export interface SiteConfig {
  name: string;
  tagline: string;
  url: string;
  locale: string;
  contact: ContactConfig;
  seo: SEOConfig;
  nav: NavConfig;
  footer: FooterConfig;
  analytics?: AnalyticsConfig;
  cms?: CMSConfig;
  theme: ThemeConfig;
}

// Template system types

export interface TemplateSectionDefinition {
  component: string;
  variant?: string;
  props: Record<string, unknown>;
  /** Nested child sections (e.g. CardGrid inside Section) */
  children?: TemplateSectionDefinition[];
  /** Whether this component is a React island (lives in islands/ not components/) */
  isIsland?: boolean;
  /** Astro client directive for islands: 'visible' | 'idle' | 'load' */
  clientDirective?: 'visible' | 'idle' | 'load';
}

export interface TemplatePageDefinition {
  slug: string;
  title: string;
  description: string;
  layout: string;
  sections: TemplateSectionDefinition[];
}

export interface TemplateColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface TemplateThemeTokens {
  colors: {
    primary: TemplateColorScale;
    secondary: TemplateColorScale;
    accent: TemplateColorScale;
    neutral: TemplateColorScale;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  screenshot: string;
  category: string;
  /** Key features for display in the template gallery */
  features?: string[];
  pages: TemplatePageDefinition[];
  defaultTheme: ThemeConfig;
  defaultTokens: TemplateThemeTokens;
  defaultNav: NavConfig;
  defaultFooter: FooterConfig;
  defaultSeo: Partial<SEOConfig>;
}
