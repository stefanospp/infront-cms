import { createDirectusClient, getPublishedItems, getItemBySlug } from '@agency/utils';

const directusUrl = import.meta.env.DIRECTUS_URL;
const directusToken = import.meta.env.DIRECTUS_TOKEN;

export const client = directusUrl ? createDirectusClient(directusUrl, directusToken) : null;

// --- Architecture Projects (custom collection) ---

export async function getProjects(options?: { limit?: number }) {
  if (!client) return [];
  return getPublishedItems(client, 'projects', {
    fields: [
      'id', 'title', 'slug', 'description', 'location', 'year', 'area_sqm',
      'project_type', 'featured_image', 'gallery', 'awards', 'sort_order',
    ],
    sort: ['sort_order'],
    limit: options?.limit,
  });
}

export async function getProjectBySlug(slug: string) {
  if (!client) return null;
  return getItemBySlug(client, 'projects', slug, {
    fields: [
      'id', 'title', 'slug', 'description', 'location', 'year', 'area_sqm',
      'project_type', 'featured_image', 'gallery', 'awards',
    ],
  });
}

// --- Standard collections ---

export async function getTeamMembers() {
  if (!client) return [];
  return getPublishedItems(client, 'team', {
    fields: ['id', 'name', 'role', 'bio', 'photo', 'email', 'sort_order'],
    sort: ['sort_order'],
  });
}

export async function getTestimonials() {
  if (!client) return [];
  return getPublishedItems(client, 'testimonials', {
    fields: ['id', 'quote', 'author', 'role', 'image', 'sort_order'],
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

export async function getStats() {
  if (!client) return [];
  return getPublishedItems(client, 'stats', {
    fields: ['id', 'value', 'label', 'prefix', 'suffix', 'sort_order'],
    sort: ['sort_order'],
  });
}
