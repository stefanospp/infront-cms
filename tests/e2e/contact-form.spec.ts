import { test, expect } from '@playwright/test';

test('contact form validates required fields', async ({ page }) => {
  await page.goto('/contact');

  await page.click('button[type="submit"]');

  await expect(page.locator('[data-testid="error-name"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-email"]')).toBeVisible();
});

test('contact form submits successfully with valid data', async ({ page }) => {
  await page.goto('/contact');

  await page.fill('[name="name"]', 'John Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.fill('[name="message"]', 'This is a test message with enough characters.');

  await page.click('button[type="submit"]');

  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});

test('honeypot field blocks spam', async ({ page }) => {
  await page.goto('/contact');

  await page.fill('[name="name"]', 'Spam Bot');
  await page.fill('[name="email"]', 'spam@example.com');
  await page.fill('[name="message"]', 'This is a spam message with enough characters.');
  await page.fill('[name="website"]', 'https://spam-site.com');

  await page.click('button[type="submit"]');

  await expect(page.locator('[data-testid="success-message"]')).not.toBeVisible();
});
