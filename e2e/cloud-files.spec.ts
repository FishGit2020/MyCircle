import { test, expect } from './fixtures';

test.describe('Cloud Files', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/files');
  });

  test('renders Cloud Files page', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('shows sign-in message for unauthenticated users', async ({ page }) => {
    await expect(page.getByText(/sign in/i)).toBeVisible({ timeout: 15_000 });
  });
});
