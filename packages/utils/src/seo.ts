import type { SEOConfig, SiteConfig } from '@agency/config';

export function formatTitle(title: string, template: string): string {
  return template.replace('%s', title);
}

export function generateMeta(
  config: { seo: SEOConfig; url: string },
  pageProps: {
    title?: string;
    description?: string;
    ogImage?: string;
    ogType?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
  },
) {
  const title = pageProps.title
    ? formatTitle(pageProps.title, config.seo.titleTemplate)
    : config.seo.defaultTitle;

  const description = pageProps.description ?? config.seo.defaultDescription;
  const ogImage = pageProps.ogImage ?? config.seo.defaultOgImage;
  const ogType = pageProps.ogType ?? 'website';
  const canonicalUrl = pageProps.canonicalUrl ?? config.url;
  const noIndex = pageProps.noIndex ?? false;

  return {
    title,
    description,
    ogImage,
    ogType,
    canonicalUrl,
    noIndex,
  };
}

export function generateStructuredData(
  config: SiteConfig,
  pageData?: Record<string, unknown>,
) {
  const baseType = config.seo.structuredData?.type ?? 'Organization';

  return {
    '@context': 'https://schema.org',
    '@type': baseType,
    name: config.name,
    url: config.url,
    description: config.seo.defaultDescription,
    ...config.seo.structuredData,
    ...pageData,
  };
}
