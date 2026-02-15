import { test, expect } from './fixtures';

test.describe('Notebook', () => {
  test('navigates to the Notebook page and shows sign-in prompt', async ({ page }) => {
    await page.goto('/notebook');

    // Notebook requires auth + __notebook API — without it, shows sign-in message
    await expect(page.getByText(/sign in to use your notebook/i)).toBeVisible({ timeout: 10000 });
  });

  test('navigating to /notebook via nav link works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /notebook/i }).first().click();

    await expect(page).toHaveURL('/notebook');
  });
});
