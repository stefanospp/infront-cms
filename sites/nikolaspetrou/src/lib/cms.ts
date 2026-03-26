import type {
  CmsItem, SiteSettingsData, HeroData, AboutData, ProjectData,
  ServiceData, TestimonialData, ReelData,
} from './types';

export type * from './types';

// ─── SonicJs client ───────────────────────────────────────────────────────────

interface SonicJsResponse<T> {
  data: CmsItem<T>[];
}

let _previewMode = false;
export function setPreviewMode(enabled: boolean) { _previewMode = enabled; }
export function isPreviewMode() { return _previewMode; }

async function fetchCollection<T>(collection: string, options?: { limit?: number }): Promise<CmsItem<T>[]> {
  const cmsUrl = import.meta.env.SONICJS_URL;
  if (!cmsUrl) return [];

  try {
    const params = new URLSearchParams();
    if (!_previewMode) params.set('status', 'published');
    if (options?.limit) params.set('limit', String(options.limit));

    const res = await fetch(`${cmsUrl}/api/collections/${collection}/content?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return [];

    const json = (await res.json()) as SonicJsResponse<T>;
    return json.data ?? [];
  } catch {
    return [];
  }
}

function parseJson<T>(value: unknown): T {
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return value as unknown as T; }
  }
  return value as T;
}

function sortBy<T>(items: CmsItem<T>[], field: keyof T): CmsItem<T>[] {
  return [...items].sort((a, b) => ((a.data[field] as number) ?? 999) - ((b.data[field] as number) ?? 999));
}

// ─── Site Settings ────────────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<CmsItem<SiteSettingsData> | null> {
  const items = await fetchCollection<SiteSettingsData>('site_settings', { limit: 1 });
  if (items[0]) {
    items[0].data.nav_items = parseJson(items[0].data.nav_items);
    items[0].data.notification_emails = parseJson(items[0].data.notification_emails);
    return items[0];
  }
  return null;
}

/** Build a config object compatible with Nav/Footer/Layout components */
export function buildConfig(settings: CmsItem<SiteSettingsData> | null) {
  const s = settings?.data;
  return {
    name: settings?.title ?? 'Nikolas Petrou',
    tagline: s?.tagline ?? '',
    url: 'https://nikolaspetrou.com',
    locale: 'en-GB',
    contact: {
      email: s?.email ?? 'hello@nikolaspetrou.com',
      phone: '',
      address: { street: '', city: '', postcode: '', country: '' },
    },
    seo: {
      defaultTitle: s?.seo_title ?? 'Nikolas Petrou',
      titleTemplate: '%s | Nikolas Petrou',
      defaultDescription: s?.seo_description ?? '',
      defaultOgImage: '/og-default.svg',
      structuredData: { type: 'Organization' as const },
    },
    nav: {
      items: (s?.nav_items ?? []).map(i => ({ label: i.label, href: i.href })),
      cta: s?.nav_cta_label ? { label: s.nav_cta_label, href: s.nav_cta_href ?? '/contact' } : undefined,
    },
    footer: {
      columns: [],
      legalLinks: [],
      text: s?.footer_text ?? '',
      socialLinks: {
        instagram: s?.instagram_url ?? '',
        facebook: s?.facebook_url ?? '',
      },
    },
    theme: {
      navStyle: 'fixed' as const,
      footerStyle: 'multi-column' as const,
      heroDefault: 'fullscreen' as const,
      borderStyle: 'pill' as const,
    },
  };
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export async function getHero(): Promise<CmsItem<HeroData> | null> {
  const items = await fetchCollection<HeroData>('hero', { limit: 1 });
  return items[0] ?? null;
}

// ─── About ────────────────────────────────────────────────────────────────────

export async function getAbout(): Promise<CmsItem<AboutData> | null> {
  const items = await fetchCollection<AboutData>('about', { limit: 1 });
  return items[0] ?? null;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(options?: { limit?: number }): Promise<CmsItem<ProjectData>[]> {
  const items = sortBy(await fetchCollection<ProjectData>('projects', options), 'sort_order');
  items.forEach(i => { i.data.gallery = parseJson(i.data.gallery) ?? []; });
  return items;
}

export async function getHeroProjects(): Promise<CmsItem<ProjectData>[]> {
  const all = await getProjects();
  return all
    .filter(p => p.data.featured_in_hero)
    .sort((a, b) => (a.data.hero_sort_order ?? 999) - (b.data.hero_sort_order ?? 999));
}

export async function getProjectBySlug(slug: string): Promise<CmsItem<ProjectData> | null> {
  const all = await getProjects();
  return all.find(p => p.slug === slug) ?? null;
}

// ─── Services ─────────────────────────────────────────────────────────────────

export async function getServices(options?: { limit?: number }): Promise<CmsItem<ServiceData>[]> {
  const items = sortBy(await fetchCollection<ServiceData>('services', options), 'sort_order');
  items.forEach(i => { i.data.tags = parseJson(i.data.tags) ?? []; });
  return items;
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

export async function getTestimonials(): Promise<CmsItem<TestimonialData>[]> {
  return sortBy(await fetchCollection<TestimonialData>('testimonials'), 'sort_order');
}

// ─── Reels ────────────────────────────────────────────────────────────────────

export async function getReels(): Promise<CmsItem<ReelData>[]> {
  return sortBy(await fetchCollection<ReelData>('reels'), 'sort_order');
}
