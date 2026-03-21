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
