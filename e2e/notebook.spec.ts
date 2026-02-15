import { test, expect } from './fixtures';

test.describe('Notebook', () => {
  test('navigates to the Notebook page', async ({ page }) => {
    await page.goto('/notebook');

    // The page should load with notebook heading or content
    await expect(page.getByRole('heading', { name: /notebook/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows create new note button', async ({ page }) => {
    await page.goto('/notebook');

    // Should show a button to create a new note
    const newNoteButton = page.getByRole('button', { name: /new|create|add/i }).first();
    await expect(newNoteButton).toBeVisible({ timeout: 10000 });
  });

  test('navigating to /notebook via nav link works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /notebook/i }).first().click();

    await expect(page).toHaveURL('/notebook');
  });
});
