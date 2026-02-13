import { test, expect } from '@playwright/test';

test.describe('Earnings Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stocks');
  });

  test('shows earnings calendar heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /earnings calendar/i });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('shows week navigation controls', async ({ page }) => {
    await expect(page.getByText(/this week/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel('Previous week')).toBeVisible();
    await expect(page.getByLabel('Next week')).toBeVisible();
  });

  test('can navigate to next week', async ({ page }) => {
    await expect(page.getByText(/this week/i)).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Next week').click();
    await expect(page.getByText(/next week/i)).toBeVisible();
  });

  test('earnings section hides when a stock is selected', async ({ page }) => {
    const earningsHeading = page.getByRole('heading', { name: /earnings calendar/i });
    await expect(earningsHeading).toBeVisible({ timeout: 10000 });

    // Search and select a stock
    const searchInput = page.getByPlaceholderText(/search stocks/i);
    await searchInput.fill('AAPL');
    const result = page.locator('[role="option"]').first();
    await expect(result).toBeVisible({ timeout: 10000 });
    await result.click();

    // Earnings should be hidden
    await expect(earningsHeading).not.toBeVisible();
  });
});
