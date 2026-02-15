import { test, expect } from './fixtures';

test.describe('Baby Tracker', () => {
  test('navigates to the Baby Tracker page', async ({ page }) => {
    await page.goto('/baby');

    // The page should load with baby tracker heading or content
    await expect(page.getByRole('heading', { name: /baby/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows due date input or week selector', async ({ page }) => {
    await page.goto('/baby');

    // Baby tracker should show some form of date input or week display
    const dateOrWeekElement = page.locator('input[type="date"], [data-testid="due-date"], text=/due date|week/i').first();
    await expect(dateOrWeekElement).toBeVisible({ timeout: 10000 });
  });

  test('navigating to /baby via nav link works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /baby/i }).first().click();

    await expect(page).toHaveURL('/baby');
  });
});
