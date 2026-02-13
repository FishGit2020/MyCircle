import { test, expect } from './fixtures';

test.describe('Daily Devotional (Bible)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bible');
  });

  test('renders daily devotional card with theme', async ({ page }) => {
    await expect(page.getByText(/Daily Devotional/i)).toBeVisible({ timeout: 15_000 });
    // Should show the Read Passage button
    await expect(page.getByText(/Read Passage/i)).toBeVisible();
  });

  test('navigates to passage when Read Passage is clicked', async ({ page }) => {
    await expect(page.getByText(/Daily Devotional/i)).toBeVisible({ timeout: 15_000 });
    await page.getByText(/Read Passage/i).click();

    // Should show Completed state and the passage content area
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 10_000 });
  });

  test('shows completed state when already done today', async ({ page }) => {
    // Pre-set today's devotional as completed
    const d = new Date();
    const todayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    await page.evaluate((key) => {
      localStorage.setItem('bible-devotional-log', JSON.stringify([key]));
    }, todayKey);

    await page.reload();
    await expect(page.getByText(/Daily Devotional/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Completed/i)).toBeVisible();
  });
});
