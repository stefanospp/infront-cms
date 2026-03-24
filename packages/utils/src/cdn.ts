const CDN_BASE_URL = 'https://cdn.infront.cy';

/**
 * Get the public CDN URL for a file.
 *
 * @param clientId - The client's numeric ID
 * @param filePath - Path within the client's CDN folder (e.g. "images/hero.webp")
 */
export function getCdnUrl(clientId: number | string, filePath: string): string {
  const cleanPath = filePath.replace(/^\//, '');
  return `${CDN_BASE_URL}/${clientId}/${cleanPath}`;
}
