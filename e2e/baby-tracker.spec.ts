import { test, expect } from './fixtures';

test.describe('Baby Tracker', () => {
  test('navigates to the Baby Tracker page', async ({ page }) => {
    await page.goto('/baby');

    // Baby Tracker renders with translated heading "Baby Growth Tracker"
    await expect(page.getByRole('heading', { name: /baby growth tracker/i })).toBeVisible({ timeout: 10000 });
  });

  test('shows due date input', async ({ page }) => {
    await page.goto('/baby');

    // Should have a date input for the due date
    await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 10000 });
  });

  test('shows prompt to set due date when none is set', async ({ page }) => {
    await page.goto('/baby');

    // Without a due date, shows a "no due date" message area
    await expect(page.getByText(/due date/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('navigating to /baby via nav link works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /baby/i }).first().click();

    await expect(page).toHaveURL('/baby');
  });
});
