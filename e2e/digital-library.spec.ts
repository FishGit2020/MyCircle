import { test, expect } from './fixtures';

test.describe('Digital Library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/library');
  });

  test('renders page without crash', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('breadcrumb shows Library', async ({ page }) => {
    await expect(page.getByText('Library').first()).toBeVisible({ timeout: 15_000 });
  });

  test('shows page title or loading state', async ({ page }) => {
    // MFE loads asynchronously — either the title appears or loading state is visible
    const title = page.getByRole('heading', { name: /library|biblioteca|图书/i }).first();
    const loading = page.getByText(/loading/i).first();
    await expect(title.or(loading)).toBeVisible({ timeout: 20_000 });
  });
});
