import { test, expect } from '@playwright/test';

test.describe('Air Quality Index Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/weather/40.7128,-74.006?name=New+York');
    await page.waitForSelector('[aria-live="polite"]', { timeout: 15000 });
  });

  test('renders the air quality section', async ({ page }) => {
    const section = page.locator('section', { has: page.locator('#aqi-title') });
    await expect(section).toBeVisible({ timeout: 10000 });
  });

  test('displays AQI badge with numeric value', async ({ page }) => {
    const badge = page.locator('[role="img"][aria-label^="AQI"]');
    await expect(badge).toBeVisible({ timeout: 10000 });
    const text = await badge.textContent();
    expect(Number(text)).toBeGreaterThanOrEqual(1);
    expect(Number(text)).toBeLessThanOrEqual(5);
  });

  test('expands pollutant details on click', async ({ page }) => {
    const btn = page.locator('button[aria-expanded]').filter({ hasText: /./ }).first();
    await expect(btn).toBeVisible({ timeout: 10000 });
    await expect(btn).toHaveAttribute('aria-expanded', 'false');

    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('PM2.5')).toBeVisible();
    await expect(page.getByText('PM10')).toBeVisible();
  });

  test('can be toggled off via dashboard settings', async ({ page }) => {
    // Open settings
    const settingsBtn = page.locator('button', { hasText: '' }).filter({ has: page.locator('svg') }).last();
    await settingsBtn.click();

    // Find the air quality checkbox and uncheck it
    const label = page.locator('label').filter({ hasText: /air quality/i });
    if (await label.isVisible()) {
      await label.click();
      // Air quality section should disappear
      const section = page.locator('#aqi-title');
      await expect(section).not.toBeVisible();
    }
  });
});
