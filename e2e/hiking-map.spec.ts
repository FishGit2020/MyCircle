import { test, expect } from './fixtures';

test.describe('Hiking Map', () => {
  test('hiking nav item appears in the header navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/hiking"]').first()).toBeAttached();
  });

  test('renders page without crash', async ({ page }) => {
    await page.goto('/hiking');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('breadcrumb shows Hiking Map', async ({ page }) => {
    await page.goto('/hiking');
    await expect(page.getByText(/hiking map|mapa de senderismo|徒步地图/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
