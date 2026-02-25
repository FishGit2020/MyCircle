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
    // The cloud-files MFE shows a lock icon + "Sign in to use Cloud Files" message
    // Use a locator scoped to the main content area to avoid matching the header Sign In button
    const main = page.locator('main, [role="main"], .flex-1');
    await expect(main.getByText(/sign in/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
