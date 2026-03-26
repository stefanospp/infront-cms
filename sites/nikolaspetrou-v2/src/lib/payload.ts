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

export interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  year: number;
  video_url: string;
  order: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  video_url?: string;
  order: number;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  hero: {
    heading: string;
    subtext: string;
    video_url: string;
  };
  contact: {
    email: string;
    phone?: string;
  };
  social: {
    instagram?: string;
    vimeo?: string;
    youtube?: string;
  };
  clients: { name: string }[];
  aboutText: string;
  horizontalWords: { word: string }[];
}

export async function getProjects(): Promise<Project[]> {
  const data = await fetchPayload<PayloadResponse<Project>>('/projects?sort=order&limit=20');
  return data.docs;
}

export async function getServices(): Promise<Service[]> {
  const data = await fetchPayload<PayloadResponse<Service>>('/services?sort=order&limit=20');
  return data.docs;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return fetchPayload<SiteSettings>('/globals/site-settings');
}
