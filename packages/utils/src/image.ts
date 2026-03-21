export function getDirectusImageUrl(
  cmsUrl: string,
  imageId: string,
  options?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'inside' | 'outside';
    format?: 'webp' | 'avif' | 'jpg' | 'png';
    quality?: number;
  },
): string {
  const url = new URL(`/assets/${imageId}`, cmsUrl);

  const format = options?.format ?? 'webp';
  const quality = options?.quality ?? 80;

  url.searchParams.set('format', format);
  url.searchParams.set('quality', String(quality));

  if (options?.width != null) {
    url.searchParams.set('width', String(options.width));
  }
  if (options?.height != null) {
    url.searchParams.set('height', String(options.height));
  }
  if (options?.fit != null) {
    url.searchParams.set('fit', options.fit);
  }

  return url.toString();
}
