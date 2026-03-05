import { test, expect } from './fixtures';

test.describe('Notebook', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notebook');
  });

  test('renders page without crash', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('breadcrumb shows Notebook', async ({ page }) => {
    await expect(page.getByText('Notebook').first()).toBeVisible({ timeout: 15_000 });
  });

  test('shows content or sign-in prompt', async ({ page }) => {
    // Either shows notebook tabs, sign-in prompt, or loading state.
    // Use count check to avoid strict mode violation when multiple elements
    // match across branches (e.g. "Sign In" nav button + "Loading" spinner).
    await expect(async () => {
      const signIn = await page.getByText(/sign in|iniciar sesi|登录/i).count();
      const notes = await page.getByText(/notes|notas|笔记/i).count();
      const loading = await page.getByText(/loading/i).count();
      expect(signIn + notes + loading).toBeGreaterThan(0);
    }).toPass();
  });
});
