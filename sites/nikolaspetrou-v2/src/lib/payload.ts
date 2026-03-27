const PAYLOAD_URL = import.meta.env.PAYLOAD_URL || 'http://localhost:3000';

interface PayloadResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
}

async function fetchPayload<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${PAYLOAD_URL}/api${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Payload API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ──

export interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  year: number;
  video_url: string;
  role?: string;
  fullDescription?: string;
  order: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  video_url?: string;
  order: number;
}

export interface Client {
  id: string;
  name: string;
  type?: string;
  year?: number;
  video_url?: string;
  order: number;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  navLinks: NavLink[];
  contact: {
    email: string;
    phone?: string;
  };
  social: {
    instagram?: string;
    vimeo?: string;
    youtube?: string;
  };
}

export interface HomeSections {
  hero: {
    heading: string;
    subtext: string;
    video_url: string;
  };
  works: {
    label: string;
  };
  horizontalScroll: {
    words: { word: string; videoUrl?: string }[];
  };
  services: {
    label: string;
  };
  clients: {
    label: string;
  };
  footer: {
    label: string;
    ctaLine1: string;
    ctaLine2: string;
    ctaLine3: string;
    video_url: string;
    email: string;
    socialLinks: { label: string; href: string }[];
  };
}

export interface AboutPage {
  video_url: string;
  directorName: string;
  location: string;
  specialisations: { text: string }[];
  bio: string;
  bio2: string;
  stats: { value: string; label: string }[];
  process: { title: string; description: string }[];
  equipment: { name: string }[];
}

export interface ContactPage {
  heading: string;
  subtext: string;
  email: string;
  location: string;
  socialLinks: { label: string; href: string }[];
  projectTypes: { label: string; value: string }[];
  budgetRanges: { label: string; value: string }[];
}

export interface LegalPage {
  lastUpdated: string;
  privacySections: { title: string; body: string }[];
  termsSections: { title: string; body: string }[];
}

export interface PagesGlobal {
  about: AboutPage;
  contact: ContactPage;
  legal: LegalPage;
}

// ── Fetch Functions ──

export async function getProjects(): Promise<Project[]> {
  const data = await fetchPayload<PayloadResponse<Project>>('/projects?sort=order&limit=50');
  return data.docs;
}

export async function getProject(slug: string): Promise<Project | null> {
  const data = await fetchPayload<PayloadResponse<Project>>(
    `/projects?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`,
  );
  return data.docs[0] || null;
}

export async function getServices(): Promise<Service[]> {
  const data = await fetchPayload<PayloadResponse<Service>>('/services?sort=order&limit=50');
  return data.docs;
}

export async function getClients(): Promise<Client[]> {
  const data = await fetchPayload<PayloadResponse<Client>>('/clients?sort=order&limit=50');
  return data.docs;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return fetchPayload<SiteSettings>('/globals/site-settings');
}

export async function getHomeSections(): Promise<HomeSections> {
  return fetchPayload<HomeSections>('/globals/home-sections');
}

export async function getPages(): Promise<PagesGlobal> {
  return fetchPayload<PagesGlobal>('/globals/pages');
}
