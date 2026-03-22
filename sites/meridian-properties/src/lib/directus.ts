import { createDirectusClient, getPublishedItems, getItemBySlug } from '@agency/utils';

const directusUrl = import.meta.env.DIRECTUS_URL;
const directusToken = import.meta.env.DIRECTUS_TOKEN;

export const client = directusUrl ? createDirectusClient(directusUrl, directusToken) : null;

export async function getPages() {
  if (!client) return [];
  return getPublishedItems(client, 'pages', {
    fields: ['id', 'title', 'slug', 'content', 'seo_title', 'seo_description', 'og_image', 'sort_order'],
    sort: ['sort_order'],
  });
}

export async function getPageBySlug(slug: string) {
  if (!client) return null;
  return getItemBySlug(client, 'pages', slug, {
    fields: ['id', 'title', 'slug', 'content', 'seo_title', 'seo_description', 'og_image'],
  });
}

export async function getPosts() {
  if (!client) return [];
  return getPublishedItems(client, 'posts', {
    fields: ['id', 'title', 'slug', 'excerpt', 'featured_image', 'published_date', 'author'],
    sort: ['-published_date'],
  });
}

export async function getPostBySlug(slug: string) {
  if (!client) return null;
  return getItemBySlug(client, 'posts', slug, {
    fields: ['id', 'title', 'slug', 'content', 'excerpt', 'featured_image', 'published_date', 'author', 'seo_title', 'seo_description', 'og_image'],
  });
}

export async function getTeamMembers() {
  if (!client) return [];
  return getPublishedItems(client, 'team', {
    fields: ['id', 'name', 'role', 'bio', 'photo', 'email', 'sort_order'],
    sort: ['sort_order'],
  });
}

export async function getServices() {
  if (!client) return [];
  return getPublishedItems(client, 'services', {
    fields: ['id', 'title', 'description', 'icon', 'image', 'href', 'sort_order'],
    sort: ['sort_order'],
  });
}

export async function getTestimonials() {
  if (!client) return [];
  return getPublishedItems(client, 'testimonials', {
    fields: ['id', 'quote', 'author', 'company', 'image', 'sort_order'],
    sort: ['sort_order'],
  });
}

export async function getProperties(options?: { limit?: number }) {
  if (!client) return [];
  return getPublishedItems(client, 'properties', {
    fields: ['id', 'title', 'slug', 'description', 'price', 'bedrooms', 'bathrooms', 'area_sqm', 'location', 'property_type', 'featured_image', 'gallery', 'features', 'sort_order'],
    sort: ['sort_order'],
    limit: options?.limit,
  });
}

export async function getPropertyBySlug(slug: string) {
  if (!client) return null;
  return getItemBySlug(client, 'properties', slug, {
    fields: ['id', 'title', 'slug', 'description', 'price', 'bedrooms', 'bathrooms', 'area_sqm', 'location', 'property_type', 'featured_image', 'gallery', 'features'],
  });
}

export async function getFaqs() {
  if (!client) return [];
  return getPublishedItems(client, 'faqs', {
    fields: ['id', 'question', 'answer', 'sort_order'],
    sort: ['sort_order'],
  });
}

export async function getGalleryItems() {
  if (!client) return [];
  return getPublishedItems(client, 'gallery', {
    fields: ['id', 'title', 'description', 'image', 'href', 'sort_order'],
    sort: ['sort_order'],
  });
}

export async function getClients() {
  if (!client) return [];
  return getPublishedItems(client, 'clients', {
    fields: ['id', 'name', 'logo', 'href', 'sort_order'],
    sort: ['sort_order'],
  });
}

export async function getStats() {
  if (!client) return [];
  return getPublishedItems(client, 'stats', {
    fields: ['id', 'value', 'label', 'prefix', 'suffix', 'sort_order'],
    sort: ['sort_order'],
  });
}

export async function getComparisons() {
  if (!client) return [];
  return getPublishedItems(client, 'comparisons', {
    fields: ['id', 'name', 'price', 'period', 'description', 'features', 'cta_text', 'cta_href', 'highlighted', 'sort_order'],
    sort: ['sort_order'],
  });
}
