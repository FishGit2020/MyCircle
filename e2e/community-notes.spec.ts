import { test, expect } from './fixtures';

test.describe('Community Notes (Bible)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bible');
  });

  test('renders Bible reader with Verse of the Day', async ({ page }) => {
    await expect(page.getByText(/Verse of the Day/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/John 3:16/)).toBeVisible();
  });

  test('shows notes toggle on passage view', async ({ page }) => {
    // Navigate to a single-chapter book (Philemon has 1 chapter, goes straight to passage)
    await expect(page.getByText('Read Scripture')).toBeVisible({ timeout: 15_000 });
    await page.getByText('Philemon').click();

    // Should show the notes toggle
    await expect(page.getByText('My Notes')).toBeVisible({ timeout: 10_000 });
  });

  test('can expand notes and type in textarea', async ({ page }) => {
    await expect(page.getByText('Read Scripture')).toBeVisible({ timeout: 15_000 });
    await page.getByText('Philemon').click();

    await expect(page.getByText('My Notes')).toBeVisible({ timeout: 10_000 });
    await page.getByText('My Notes').click();

    const textarea = page.getByPlaceholderText(/Write your notes/i);
    await expect(textarea).toBeVisible();
    await textarea.fill('This is my personal note');
    await expect(textarea).toHaveValue('This is my personal note');
  });
});
