import { test, expect } from './fixtures';

test.describe('Deal Finder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/deals');
  });

  test('renders deal finder page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /deal finder/i })).toBeVisible({ timeout: 5000 });
  });

  test('has a search input', async ({ page }) => {
    await expect(page.getByPlaceholder(/search deals/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows source filter tabs', async ({ page }) => {
    await expect(page.getByText(/all sources/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/slickdeals/i).first()).toBeVisible();
  });

  test('shows deal cards', async ({ page }) => {
    // Should show demo deal cards
    await expect(page.getByText(/deals found/i)).toBeVisible({ timeout: 5000 });
  });
});
