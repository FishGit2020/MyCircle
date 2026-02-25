import { test, expect } from './fixtures';

test.describe('Cloud Files', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/files');
  });

  test('renders Cloud Files page', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('shows sign-in prompt for unauthenticated users', async ({ page }) => {
    // The MFE shows "Sign in to use Cloud Files" when not authenticated
    // Use a broad match since the text may vary by locale
    await expect(page.getByText(/sign in|iniciar sesi|登录/i)).toBeVisible({ timeout: 15_000 });
  });
});
