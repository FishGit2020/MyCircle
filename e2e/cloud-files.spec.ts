import { test, expect } from './fixtures';

test.describe('Cloud Files', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/files');
  });

  test('renders Cloud Files page', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('shows sign-in prompt or loading state for unauthenticated users', async ({ page }) => {
    // The cloud-files MFE loads via Module Federation and shows either:
    // - "Sign in to use Cloud Files" prompt (when MFE loaded + auth check done)
    // - A loading spinner (if MFE is still loading)
    // - The Cloud Files heading (if MFE loaded)
    // Accept any of these as proof the route works
    const signIn = page.getByText(/sign in to use cloud files/i);
    const heading = page.getByText(/cloud files/i).first();
    await expect(signIn.or(heading)).toBeVisible({ timeout: 15_000 });
  });
});
