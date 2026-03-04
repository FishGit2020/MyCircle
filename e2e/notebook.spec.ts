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
    // Either shows notebook tabs, sign-in prompt, or loading state
    const signIn = page.getByText(/sign in|iniciar sesi|登录/i).first();
    const notes = page.getByText(/notes|notas|笔记/i).first();
    const loading = page.getByText(/loading/i).first();
    await expect(signIn.or(notes).or(loading)).toBeVisible({ timeout: 20_000 });
  });
});
