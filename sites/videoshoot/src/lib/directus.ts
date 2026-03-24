import { createDirectusClient, getPublishedItems } from '@agency/utils';

const directusUrl = import.meta.env.DIRECTUS_URL;
const directusToken = import.meta.env.DIRECTUS_TOKEN;

export const client = directusUrl ? createDirectusClient(directusUrl, directusToken) : null;

// --- Types ---

export interface Project {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  image?: string;
  video_url?: string;
  reel_url?: string;
  sort_order: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  tags: string[];
  icon?: string;
  video_url?: string;
  sort_order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  quote: string;
  video_url?: string;
  image?: string;
  sort_order: number;
}

export interface Reel {
  id: string;
  url: string;
  image?: string;
  date_label?: string;
  sort_order: number;
}

export interface HeroContent {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  cta_text?: string;
  cta_href?: string;
  secondary_cta_text?: string;
  secondary_cta_href?: string;
  background_video?: string;
  background_poster?: string;
}

export interface AboutContent {
  heading?: string;
  subheading?: string;
  description?: string;
  hero_image?: string;
  cta_text?: string;
  values_heading?: string;
  values_description?: string;
}

export interface SiteSettings {
  name?: string;
  tagline?: string;
  email?: string;
  seo_title?: string;
  seo_description?: string;
  instagram_url?: string;
  facebook_url?: string;
}

// --- Queries ---

export async function getProjects(options?: { limit?: number }): Promise<Project[]> {
  if (!client) return [];
  return getPublishedItems<Project>(client, 'projects', {
    fields: ['id', 'title', 'slug', 'subtitle', 'image', 'video_url', 'reel_url', 'sort_order'],
    sort: ['sort_order'],
    limit: options?.limit,
  });
}

export async function getServices(options?: { limit?: number }): Promise<Service[]> {
  if (!client) return [];
  return getPublishedItems<Service>(client, 'services', {
    fields: ['id', 'title', 'description', 'tags', 'icon', 'video_url', 'sort_order'],
    sort: ['sort_order'],
    limit: options?.limit,
  });
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (!client) return [];
  return getPublishedItems<Testimonial>(client, 'testimonials', {
    fields: ['id', 'name', 'role', 'quote', 'video_url', 'image', 'sort_order'],
    sort: ['sort_order'],
  });
}

export async function getReels(): Promise<Reel[]> {
  if (!client) return [];
  return getPublishedItems<Reel>(client, 'reels', {
    fields: ['id', 'url', 'image', 'date_label', 'sort_order'],
    sort: ['sort_order'],
  });
}

export async function getHero(): Promise<HeroContent | null> {
  if (!client) return null;
  try {
    const items = await getPublishedItems<HeroContent>(client, 'hero', { limit: 1 });
    return items[0] ?? null;
  } catch {
    return null;
  }
}

export async function getAbout(): Promise<AboutContent | null> {
  if (!client) return null;
  try {
    const items = await getPublishedItems<AboutContent>(client, 'about', { limit: 1 });
    return items[0] ?? null;
  } catch {
    return null;
  }
}

export async function getSettings(): Promise<SiteSettings | null> {
  if (!client) return null;
  try {
    const items = await getPublishedItems<SiteSettings>(client, 'settings', { limit: 1 });
    return items[0] ?? null;
  } catch {
    return null;
  }
}
