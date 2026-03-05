import { test, expect } from './fixtures';

test.describe('Weather Compare', () => {
  test('/weather/compare route works', async ({ page }) => {
    await page.goto('/weather/compare');

    await expect(page.getByRole('heading', { name: 'Compare Weather' })).toBeVisible();
  });

  test('/weather/compare shows instruction for adding favorites', async ({ page }) => {
    await page.goto('/weather/compare');

    // Since user is not logged in, it should show a message about needing favorites/recent cities
    await expect(page.getByText(/favorites|recent/i).first()).toBeVisible();
  });

  test('compare is no longer in the navigation menu', async ({ page }) => {
    await page.goto('/');

    // Nav should not have a Compare link
    const navLinks = page.locator('nav a');
    const compareLinks = navLinks.filter({ hasText: 'Compare' });
    await expect(compareLinks).toHaveCount(0);
  });

  test('weather detail page has inline compare section', async ({ page }) => {
    // Seed session storage with a different city so the compare button appears
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.setItem('selectedCity', JSON.stringify({ name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' }));
    });

    await page.goto('/weather/51.5074,-0.1278?name=London');

    // Wait for weather to load (use heading to avoid strict mode with breadcrumb)
    await expect(page.getByRole('heading', { name: 'London' })).toBeVisible({ timeout: 15_000 });

    // Should have a "Compare Weather" expandable button
    await expect(page.getByRole('button', { name: /Compare Weather/i })).toBeVisible({ timeout: 5_000 });
  });
});
