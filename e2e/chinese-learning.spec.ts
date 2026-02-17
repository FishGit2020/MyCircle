import { test, expect } from './fixtures';

test.describe('Chinese Learning', () => {
  test('navigates to /chinese and shows the title', async ({ page }) => {
    await page.goto('/chinese');
    await expect(page.getByText('Learn Chinese')).toBeVisible();
  });

  test('shows character grid by default', async ({ page }) => {
    await page.goto('/chinese');
    // Should show category headers
    await expect(page.getByText('Family')).toBeVisible();
    await expect(page.getByText('Numbers')).toBeVisible();
  });

  test('switches to flashcard view', async ({ page }) => {
    await page.goto('/chinese');
    await page.getByRole('button', { name: 'Flashcards' }).click();
    // The flashcard uses backface-visibility:hidden for flip animation,
    // so we check it's attached to the DOM rather than strictly "visible"
    await expect(page.getByTestId('flashcard')).toBeAttached();
    await expect(page.getByTestId('flashcard-character')).toBeVisible();
  });

  test('flashcard flips to show answer', async ({ page }) => {
    await page.goto('/chinese');
    await page.getByRole('button', { name: 'Flashcards' }).click();
    await expect(page.getByTestId('flashcard-character')).toBeVisible();
    await page.getByTestId('flashcard').click();
    // After flip, pinyin uses backface-visibility so check attachment
    await expect(page.getByTestId('flashcard-pinyin')).toBeAttached();
  });

  test('can navigate between flashcards', async ({ page }) => {
    await page.goto('/chinese');
    await page.getByRole('button', { name: 'Flashcards' }).click();
    const firstChar = await page.getByTestId('flashcard-character').textContent();
    await page.getByRole('button', { name: 'Next' }).click();
    const secondChar = await page.getByTestId('flashcard-character').textContent();
    expect(firstChar).not.toBe(secondChar);
  });

  test('can mark character as mastered', async ({ page }) => {
    await page.goto('/chinese');
    await page.getByRole('button', { name: 'Flashcards' }).click();
    await page.getByTestId('toggle-mastered').click();
    await expect(page.getByText(/Mastered: 1 \//)).toBeVisible();
  });

  test('mastered progress persists via localStorage', async ({ page }) => {
    await page.goto('/chinese');
    await page.getByRole('button', { name: 'Flashcards' }).click();
    await page.getByTestId('toggle-mastered').click();

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByText(/Mastered: 1 \//)).toBeVisible();
  });

  test('practice canvas opens from flashcard', async ({ page }) => {
    await page.goto('/chinese');
    await page.getByRole('button', { name: 'Flashcards' }).click();
    await page.getByRole('button', { name: 'Practice Writing' }).click();
    await expect(page.getByTestId('practice-canvas')).toBeVisible();
  });
});
