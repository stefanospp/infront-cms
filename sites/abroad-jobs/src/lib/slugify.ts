export function slugify(title: string, country: string): string {
  const raw = `${title} ${country}`;
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function uniqueSlug(title: string, country: string): string {
  const base = slugify(title, country);
  const suffix = Date.now().toString(36).slice(-4);
  return `${base}-${suffix}`;
}
