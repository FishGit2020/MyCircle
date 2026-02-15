import { test, expect } from './fixtures';

test.describe('Notebook', () => {
  test('navigates to the Notebook page', async ({ page }) => {
    await page.goto('/notebook');

    // Notebook page loads — either shows the note list (empty state) or login prompt
    // In E2E with mocked Firebase auth, __notebook API exists, so it shows the empty note list
    const noteListOrLogin = page.getByText(/no notes yet|sign in to use/i);
    await expect(noteListOrLogin).toBeVisible({ timeout: 15000 });
  });

  test('navigating to /notebook via nav link works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /notebook/i }).first().click();

    await expect(page).toHaveURL('/notebook');
  });
});
