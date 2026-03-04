import { test, expect } from './fixtures';

test.describe('Model Benchmark', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/benchmark');
  });

  test('renders page without crash', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('breadcrumb shows Benchmark', async ({ page }) => {
    await expect(page.getByText(/benchmark|referencia|基准/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('shows title or loading state', async ({ page }) => {
    const title = page.getByRole('heading', { name: /benchmark|referencia|基准/i }).first();
    const loading = page.getByText(/loading/i).first();
    await expect(title.or(loading)).toBeVisible({ timeout: 20_000 });
  });
});
