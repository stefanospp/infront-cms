// ─── Generic SonicJs content item ─────────────────────────────────────────────

export interface CmsItem<T = Record<string, unknown>> {
  id: string;
  title: string;
  slug: string;
  status: string;
  data: T;
  created_at: number;
  updated_at: number;
}

// ─── Collection data shapes ──────────────────────────────────────────────────

export interface SiteSettingsData {
  tagline: string;
  email: string;
  seo_title: string;
  seo_description: string;
  instagram_url: string;
  facebook_url: string;
  notification_emails: string[];
  nav_items: Array<{ label: string; href: string }>;
  nav_cta_label: string;
  nav_cta_href: string;
  footer_text: string;
}

export interface HeroData {
  eyebrow: string;
  heading: string;
  subheading: string;
  cta_text: string;
  cta_href: string;
  secondary_cta_text: string;
  secondary_cta_href: string;
  background_video: string;
  background_poster: string;
}

export interface AboutData {
  heading: string;
  subheading: string;
  description: string;
  hero_image: string;
  cta_text: string;
  values_heading: string;
  values_description: string;
}

export interface ProjectData {
  subtitle: string;
  image: string;
  video_url: string;
  reel_url: string;
  sort_order: number;
  featured_in_hero: boolean;
  hero_sort_order: number;
  description: string;
  client: string;
  year: string;
  category: string;
  gallery: string[];
}

export interface ServiceData {
  description: string;
  tags: string[];
  icon: string;
  video_url: string;
  sort_order: number;
}

export interface TestimonialData {
  name: string;
  role: string;
  quote: string;
  video_url: string;
  image: string;
  sort_order: number;
}

export interface ReelData {
  url: string;
  image: string;
  date_label: string;
  sort_order: number;
}
