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
    // The text may appear anywhere on the page (MFE renders inside main or a portal)
    await expect(page.getByText(/sign in to use cloud files/i)).toBeVisible({ timeout: 15_000 });
  });
});
