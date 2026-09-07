import { test, expect } from '@playwright/test';

test('homepage renders hero with chat input', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/stay/i);
  await expect(page.getByLabel(/describe your ideal stay/i)).toBeVisible();
});

test('mock provider streams a response', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel(/describe your ideal stay/i);
  await input.fill('Hurghada');
  await page.getByRole('button', { name: /find/i }).click();
  await expect(page.getByText(/Hurghada|test hotel|How about/i)).toBeVisible({ timeout: 10_000 });
});
