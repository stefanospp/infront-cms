import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

export function createDirectusClient(url: string, token?: string) {
  const client = createDirectus(url).with(rest());

  if (token) {
    return client.with(staticToken(token));
  }

  return client;
}

export async function getPublishedItems<T>(
  client: ReturnType<typeof createDirectusClient>,
  collection: string,
  options?: {
    fields?: string[];
    sort?: string[];
    limit?: number;
  },
) {
  const query: Record<string, unknown> = {
    filter: {
      status: {
        _eq: 'published',
      },
    },
  };

  if (options?.fields) {
    query.fields = options.fields;
  }
  if (options?.sort) {
    query.sort = options.sort;
  }
  if (options?.limit != null) {
    query.limit = options.limit;
  }

  return client.request<T[]>(readItems(collection, query));
}

export async function getItemBySlug<T>(
  client: ReturnType<typeof createDirectusClient>,
  collection: string,
  slug: string,
  options?: {
    fields?: string[];
  },
) {
  const query: Record<string, unknown> = {
    filter: {
      slug: {
        _eq: slug,
      },
    },
    limit: 1,
  };

  if (options?.fields) {
    query.fields = options.fields;
  }

  const items = await client.request<T[]>(readItems(collection, query));
  return items[0] ?? null;
}
