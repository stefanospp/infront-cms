// Payload CMS fetch client for Theorium v2
// Not wired to a live CMS yet — all pages use hardcoded fallback data
// Server-only — must not be imported in client-side code

if (typeof window !== 'undefined') {
  throw new Error('payload.ts must not be imported on the client');
}

const PAYLOAD_URL = typeof import.meta.env !== 'undefined' && import.meta.env.PAYLOAD_URL
  ? import.meta.env.PAYLOAD_URL
  : 'https://cms-theorium.stepet.workers.dev';

interface PayloadResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
}

interface FetchOptions {
  draft?: boolean;
}

async function fetchPayload<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  // Prevent SSRF — endpoint must be a relative path
  if (endpoint.includes('://') || endpoint.startsWith('//')) {
    throw new Error('Invalid endpoint — must be a relative path');
  }
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = options?.draft
    ? `${PAYLOAD_URL}/api${endpoint}${separator}draft=true`
    : `${PAYLOAD_URL}/api${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Payload API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ──

export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  levels: { label: string; filled: boolean }[];
  order: number;
}

export interface Course {
  id: string;
  subject: string;
  level: string;
  name: string;
  description: string;
  duration: string;
  classSize: string;
  price: string;
  status: string;
  badge?: string;
  order: number;
}

export interface UniversityExam {
  id: string;
  region: string;
  name: string;
  description: string;
  order: number;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  navLinks: { label: string; href: string }[];
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
  };
  location: string;
  schools: string[];
}

export interface HomeSections {
  hero: {
    badge: string;
    heading: string;
    headingHighlight: string;
    subheading: string;
    stats: { label: string }[];
  };
  subjects: {
    heading: string;
    subtitle: string;
  };
  university: {
    heading: string;
    subtitle: string;
  };
  courses: {
    heading: string;
    subtitle: string;
    bundleText: string;
    bundlePrice: string;
    bundleSaving: string;
  };
  contact: {
    heading: string;
    subtitle: string;
  };
}

// ── Fetch Functions ──

export async function getSubjects(options?: FetchOptions): Promise<Subject[]> {
  const data = await fetchPayload<PayloadResponse<Subject>>('/subjects?sort=order&limit=50', options);
  return data.docs;
}

export async function getCourses(options?: FetchOptions): Promise<Course[]> {
  const data = await fetchPayload<PayloadResponse<Course>>('/courses?sort=order&limit=50', options);
  return data.docs;
}

export async function getUniversityExams(options?: FetchOptions): Promise<UniversityExam[]> {
  const data = await fetchPayload<PayloadResponse<UniversityExam>>('/university-exams?sort=order&limit=50', options);
  return data.docs;
}

export async function getSiteSettings(options?: FetchOptions): Promise<SiteSettings> {
  return fetchPayload<SiteSettings>('/globals/site-settings', options);
}

export async function getHomeSections(options?: FetchOptions): Promise<HomeSections> {
  return fetchPayload<HomeSections>('/globals/home-sections', options);
}
