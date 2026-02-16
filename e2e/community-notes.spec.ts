import { test, expect } from './fixtures';

test.describe('Bible Reader', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bible');
  });

  test('renders Bible reader with Verse of the Day', async ({ page }) => {
    await expect(page.getByText(/Verse of the Day/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/John 3:16/)).toBeVisible();
  });
});
