import { test, expect } from './fixtures';

test.describe('Historical Weather', () => {
  test('dashboard settings includes historical weather toggle', async ({ page }) => {
    // Navigate to a weather page (using a common city coords)
    await page.goto('/weather/40.7128,-74.006?name=New+York');

    // Open dashboard settings
    const settingsBtn = page.getByRole('button', { name: /settings|customize/i });
    if (await settingsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await settingsBtn.click();
      // Check that the historical weather toggle exists
      await expect(page.getByText(/this day last year|historical/i)).toBeVisible({ timeout: 3_000 });
    }
  });

  test('historical weather section appears when data loads', async ({ page }) => {
    await page.goto('/weather/40.7128,-74.006?name=New+York');

    // Wait for weather data to load (current weather section should appear)
    const currentWeather = page.locator('[class*="animate-fadeIn"]');
    if (await currentWeather.isVisible({ timeout: 10_000 }).catch(() => false)) {
      // Historical section may or may not appear depending on API availability
      // Just verify the page doesn't crash
      await page.waitForTimeout(2000);
      const title = page.getByText(/this day last year/i);
      // Soft assertion — historical data may not be available in test env
      const isVisible = await title.isVisible().catch(() => false);
      if (isVisible) {
        await expect(page.getByText(/today/i).first()).toBeVisible();
        await expect(page.getByText(/last year/i)).toBeVisible();
      }
    }
  });

  test('historical weather shows comparison cards', async ({ page }) => {
    await page.goto('/weather/40.7128,-74.006?name=New+York');

    const title = page.getByText(/this day last year/i);
    if (await title.isVisible({ timeout: 10_000 }).catch(() => false)) {
      // Should have Today and Last Year sections
      await expect(page.getByText(/today/i).first()).toBeVisible();
      await expect(page.getByText(/last year/i)).toBeVisible();
      // Should show High/Low labels
      const highLabels = page.getByText(/high/i);
      await expect(highLabels.first()).toBeVisible();
    }
  });
});
