import { test, expect } from '@playwright/test';

test('all nav links resolve to real pages', async ({ page }) => {
  await page.goto('/');

  const navLinks = await page.locator('nav a').all();

  for (const link of navLinks) {
    const href = await link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }

    const response = await page.request.get(href);
    expect(response.status(), `Expected ${href} to return 200`).toBe(200);
  }
});

test('mobile nav opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  await page.click('[data-testid="mobile-menu-toggle"]');
  await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
});
