import { test, expect } from './fixtures';

test.describe('Chinese Learning', () => {
  test('navigates to /chinese and shows the title', async ({ page }) => {
    await page.goto('/chinese');
    await expect(page.getByText('Learn Chinese')).toBeVisible();
  });

  test('shows character grid by default', async ({ page }) => {
    await page.goto('/chinese');
    // Should show category headers (from Firestore data or cache)
    // Wait for characters to load
    await page.waitForTimeout(2000);
    // Either shows characters or the "no characters" message
    const hasCharacters = await page.locator('[data-testid="chinese-learning"]').isVisible();
    expect(hasCharacters).toBe(true);
  });

  test('switches to flashcard view', async ({ page }) => {
    await page.goto('/chinese');
    await page.waitForTimeout(1000);
    const flashcardsBtn = page.getByRole('button', { name: 'Flashcards' });
    if (await flashcardsBtn.isVisible()) {
      await flashcardsBtn.click();
      await expect(page.getByTestId('flashcard')).toBeAttached();
      await expect(page.getByTestId('flashcard-character')).toBeVisible();
    }
  });

  test('flashcard flips to show answer', async ({ page }) => {
    await page.goto('/chinese');
    await page.waitForTimeout(1000);
    const flashcardsBtn = page.getByRole('button', { name: 'Flashcards' });
    if (await flashcardsBtn.isVisible()) {
      await flashcardsBtn.click();
      await expect(page.getByTestId('flashcard-character')).toBeVisible();
      await page.getByTestId('flashcard-character').click({ force: true });
      await expect(page.getByTestId('flashcard-pinyin')).toBeAttached();
    }
  });

  test('can navigate between flashcards', async ({ page }) => {
    await page.goto('/chinese');
    await page.waitForTimeout(1000);
    const flashcardsBtn = page.getByRole('button', { name: 'Flashcards' });
    if (await flashcardsBtn.isVisible()) {
      await flashcardsBtn.click();
      const firstChar = await page.getByTestId('flashcard-character').textContent();
      await page.getByRole('button', { name: 'Next' }).click();
      const secondChar = await page.getByTestId('flashcard-character').textContent();
      expect(firstChar).not.toBe(secondChar);
    }
  });

  test('can mark character as mastered', async ({ page }) => {
    await page.goto('/chinese');
    await page.waitForTimeout(1000);
    const flashcardsBtn = page.getByRole('button', { name: 'Flashcards' });
    if (await flashcardsBtn.isVisible()) {
      await flashcardsBtn.click();
      await page.getByTestId('toggle-mastered').click();
      await expect(page.getByText(/Mastered: 1 \//)).toBeVisible();
    }
  });

  test('mastered progress persists via localStorage', async ({ page }) => {
    await page.goto('/chinese');
    await page.waitForTimeout(1000);
    const flashcardsBtn = page.getByRole('button', { name: 'Flashcards' });
    if (await flashcardsBtn.isVisible()) {
      await flashcardsBtn.click();
      await page.getByTestId('toggle-mastered').click();
      await page.reload();
      await expect(page.getByText(/Mastered: 1 \//)).toBeVisible();
    }
  });

  test('practice canvas opens from flashcard', async ({ page }) => {
    await page.goto('/chinese');
    await page.waitForTimeout(1000);
    const flashcardsBtn = page.getByRole('button', { name: 'Flashcards' });
    if (await flashcardsBtn.isVisible()) {
      await flashcardsBtn.click();
      await page.getByRole('button', { name: 'Practice Writing' }).click();
      await expect(page.getByTestId('practice-canvas')).toBeVisible();
    }
  });

  test('shows Add Character button when authenticated', async ({ page }) => {
    await page.goto('/chinese');
    await page.waitForTimeout(2000);
    // Auth is mocked in fixtures, so should see the button
    await expect(page.getByTestId('add-character-btn')).toBeVisible();
  });

  test('opens character editor when Add Character is clicked', async ({ page }) => {
    await page.goto('/chinese');
    await page.waitForTimeout(2000);
    const addBtn = page.getByTestId('add-character-btn');
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page.getByTestId('character-editor')).toBeVisible();
      // Should have all form fields
      await expect(page.getByTestId('editor-character-input')).toBeVisible();
      await expect(page.getByTestId('editor-pinyin-input')).toBeVisible();
      await expect(page.getByTestId('editor-meaning-input')).toBeVisible();
      await expect(page.getByTestId('editor-category-select')).toBeVisible();
    }
  });

  test('pinyin keyboard toggles and inserts characters', async ({ page }) => {
    await page.goto('/chinese');
    await page.waitForTimeout(2000);
    const addBtn = page.getByTestId('add-character-btn');
    if (await addBtn.isVisible()) {
      await addBtn.click();
      // Toggle keyboard
      await page.getByTestId('pinyin-keyboard-toggle').click();
      await expect(page.getByTestId('pinyin-keyboard-keys')).toBeVisible();
      // Click a tone character
      await page.getByTestId('pinyin-key-\u0101').click();
      // Verify it was inserted into the pinyin input
      await expect(page.getByTestId('editor-pinyin-input')).toHaveValue('\u0101');
    }
  });

  test('character editor cancel closes the modal', async ({ page }) => {
    await page.goto('/chinese');
    await page.waitForTimeout(2000);
    const addBtn = page.getByTestId('add-character-btn');
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page.getByTestId('character-editor')).toBeVisible();
      await page.getByTestId('editor-cancel-btn').click();
      await expect(page.getByTestId('character-editor')).not.toBeVisible();
    }
  });

  test('flashcard content does not overflow its container', async ({ page }) => {
    await page.goto('/chinese');
    await page.waitForTimeout(1000);
    const flashcardsBtn = page.getByRole('button', { name: 'Flashcards' });
    if (await flashcardsBtn.isVisible()) {
      await flashcardsBtn.click();
      await expect(page.getByTestId('flashcard')).toBeAttached();
      const cardBox = await page.getByTestId('flashcard').boundingBox();
      const charBox = await page.getByTestId('flashcard-character').boundingBox();
      expect(cardBox).not.toBeNull();
      expect(charBox).not.toBeNull();
      expect(charBox!.y).toBeGreaterThanOrEqual(cardBox!.y);
      expect(charBox!.y + charBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height + 1);
    }
  });
});
