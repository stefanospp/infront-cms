/**
 * Payload CMS fetch client for Theorium v2
 * Fetches from CMS API with fallback to hardcoded data.
 * Server-only — must not be imported in client-side code.
 */

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

export interface PayloadCourse {
  id: number;
  slug: string;
  name: string;
  description: string;
  fullDescription?: unknown;
  dates: string;
  subject: string;
  level: string;
  season: string;
  examBoard: string;
  schools: unknown[];
  classSize: string;
  duration: string;
  schedule: string;
  color: string;
  status: 'enrolling' | 'coming-soon';
  price?: string;
  priceNote?: string;
  topics: { topic: string }[];
  whatYouGet: { item: string }[];
  order: number;
}

export interface PayloadSubject {
  id: number;
  slug: string;
  name: string;
  code: string;
  color: string;
  tagline: string;
  fullDescription?: unknown;
  levels: {
    name: string;
    examBoards: { board: string }[];
    topics: { topic: string }[];
  }[];
  whyStudy: { reason: string }[];
  order: number;
}

export interface PayloadSchool {
  id: number;
  name: string;
  location: string;
  examBoards: string;
  levels: { label: string; filled: boolean }[];
  order: number;
}

export interface PayloadResource {
  id: number;
  slug: string;
  name: string;
  description: string;
  subject: string;
  level: string;
  type: string;
  examBoard: string;
  file?: unknown;
  fileSize?: string;
  url?: string;
  color: string;
  status: 'available' | 'coming-soon';
  order: number;
}

export interface PayloadUniversityExam {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  region: string;
  description: string;
  fullDescription?: unknown;
  color: string;
  forWho: string;
  sections: { name: string; description: string }[];
  whatWeOffer: { item: string }[];
  timeline: string;
  order: number;
}

export interface PayloadFAQ {
  id: number;
  question: string;
  answer: string;
  order: number;
}

export interface PayloadSiteSettings {
  siteName: string;
  tagline: string;
  navLinks: { label: string; href: string }[];
  ctaLabel: string;
  ctaHref: string;
  contact: {
    email: string;
    phone?: string;
    whatsapp: string;
    viber: string;
    location: string;
    responseTime: string;
  };
  footer: {
    builderName: string;
    builderLink: string;
  };
}

export interface PayloadHomeSections {
  hero: {
    badge: string;
    heading: string;
    headingHighlight: string;
    subheading: string;
    stats: { text: string }[];
    ctaText: string;
    ctaHref: string;
  };
  why: {
    heading: string;
    description: string;
    features: { title: string; description: string }[];
  };
  howItWorks: {
    heading: string;
    steps: { number: string; title: string; description: string }[];
  };
  examPeriods: { name: string; dates: string }[];
}

// ── Fetch Functions ──

export async function getCourses(options?: FetchOptions): Promise<PayloadCourse[]> {
  const data = await fetchPayload<PayloadResponse<PayloadCourse>>('/courses?sort=order&limit=50', options);
  return data.docs;
}

export async function getCourse(slug: string, options?: FetchOptions): Promise<PayloadCourse | null> {
  const data = await fetchPayload<PayloadResponse<PayloadCourse>>(
    `/courses?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`,
    options,
  );
  return data.docs[0] || null;
}

export async function getSubjects(options?: FetchOptions): Promise<PayloadSubject[]> {
  const data = await fetchPayload<PayloadResponse<PayloadSubject>>('/subjects?sort=order&limit=50', options);
  return data.docs;
}

export async function getSchools(options?: FetchOptions): Promise<PayloadSchool[]> {
  const data = await fetchPayload<PayloadResponse<PayloadSchool>>('/schools?sort=order&limit=50', options);
  return data.docs;
}

export async function getResources(options?: FetchOptions): Promise<PayloadResource[]> {
  const data = await fetchPayload<PayloadResponse<PayloadResource>>('/resources?sort=order&limit=100', options);
  return data.docs;
}

export async function getUniversityExams(options?: FetchOptions): Promise<PayloadUniversityExam[]> {
  const data = await fetchPayload<PayloadResponse<PayloadUniversityExam>>('/university-exams?sort=order&limit=50', options);
  return data.docs;
}

export async function getFAQs(options?: FetchOptions): Promise<PayloadFAQ[]> {
  const data = await fetchPayload<PayloadResponse<PayloadFAQ>>('/faqs?sort=order&limit=50', options);
  return data.docs;
}

export async function getSiteSettings(options?: FetchOptions): Promise<PayloadSiteSettings> {
  return fetchPayload<PayloadSiteSettings>('/globals/site-settings', options);
}

export async function getHomeSections(options?: FetchOptions): Promise<PayloadHomeSections> {
  return fetchPayload<PayloadHomeSections>('/globals/home-sections', options);
}
