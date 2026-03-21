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
