import { test, expect } from './fixtures';

test.describe('Hiking Map', () => {
  test('hiking route is accessible', async ({ page }) => {
    await page.goto('/hiking');
    await page.waitForLoadState('domcontentloaded');
    // Verify the route is registered — URL should stay at /hiking (not redirect to 404)
    await expect(page).toHaveURL(/\/hiking/);
  });

  test('renders page without crash', async ({ page }) => {
    await page.goto('/hiking');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('breadcrumb shows Hiking Map', async ({ page }) => {
    await page.goto('/hiking');
    await expect(page.getByText(/hiking map|mapa de senderismo|徒步地图/i).first()).toBeVisible({ timeout: 5_000 });
  });
});
