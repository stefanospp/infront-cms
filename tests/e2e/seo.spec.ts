import { test, expect } from '@playwright/test';

const pages = ['/', '/about', '/contact'];

for (const pagePath of pages) {
  test(`every page has required meta tags: ${pagePath}`, async ({ page }) => {
    await page.goto(pagePath);

    // Title exists
    const title = await page.title();
    expect(title).toBeTruthy();

    // Meta description exists and is >50 chars
    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(50);

    // Open Graph tags
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBeTruthy();

    const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
    expect(ogDescription).toBeTruthy();

    const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
    expect(ogImage).toBeTruthy();

    // Canonical link
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBeTruthy();
  });
}

test('structured data is valid JSON-LD', async ({ page }) => {
  await page.goto('/');

  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).toBeTruthy();

  const parsed = JSON.parse(jsonLd!);
  expect(parsed['@context']).toContain('schema.org');
  expect(parsed['@type']).toBeTruthy();
});

test('sitemap.xml exists', async ({ page }) => {
  const response = await page.goto('/sitemap-index.xml');
  expect(response!.status()).toBe(200);
});

test('robots.txt exists', async ({ page }) => {
  const response = await page.goto('/robots.txt');
  expect(response!.status()).toBe(200);

  const content = await page.content();
  expect(content).toContain('Sitemap:');
});
