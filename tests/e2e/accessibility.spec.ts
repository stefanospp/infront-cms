import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home page has no critical accessibility violations', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

  const critical = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  expect(critical, `Found ${critical.length} critical/serious violations`).toHaveLength(0);
});

test('contact page has no critical accessibility violations', async ({ page }) => {
  await page.goto('/contact');

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

  const critical = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  expect(critical, `Found ${critical.length} critical/serious violations`).toHaveLength(0);
});

test('about page has no critical accessibility violations', async ({ page }) => {
  await page.goto('/about');

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

  const critical = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  expect(critical, `Found ${critical.length} critical/serious violations`).toHaveLength(0);
});
