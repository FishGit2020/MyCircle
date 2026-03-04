import { test, expect } from './fixtures';

test.describe('Baby Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/baby');
  });

  test('renders page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /baby|beb|宝宝/i }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('shows due date input', async ({ page }) => {
    // The due date date picker should be present
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible({ timeout: 15_000 });
  });

  test('shows empty state when no due date is set', async ({ page }) => {
    // Without a due date, shows "Set a due date" or similar prompt
    await expect(page.getByText(/due date|fecha|预产期/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('shows a pregnancy verse section', async ({ page }) => {
    // The verse section should be visible with a Bible verse
    const verseSection = page.locator('[class*="pink"], [class*="rose"]').first();
    await expect(verseSection).toBeVisible({ timeout: 15_000 });
  });
});
