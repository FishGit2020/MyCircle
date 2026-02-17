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
    // The 3D flip animation uses backface-visibility + absolute positioning,
    // causing the back face to intercept pointer events in Playwright.
    // Use force:true to bypass the actionability check.
    await page.getByTestId('flashcard-character').click({ force: true });
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

  test('flashcard content does not overflow its container', async ({ page }) => {
    await page.goto('/chinese');
    await page.getByRole('button', { name: 'Flashcards' }).click();
    await expect(page.getByTestId('flashcard')).toBeAttached();

    // The first card is 妈妈 (multi-character) — a good overflow test case
    const cardBox = await page.getByTestId('flashcard').boundingBox();
    const charBox = await page.getByTestId('flashcard-character').boundingBox();
    expect(cardBox).not.toBeNull();
    expect(charBox).not.toBeNull();

    // Character text must be fully inside the card container
    expect(charBox!.y).toBeGreaterThanOrEqual(cardBox!.y);
    expect(charBox!.y + charBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height + 1);
    expect(charBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
    expect(charBox!.x + charBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width + 1);
  });

  test('flashcard does not overlap category filter pills', async ({ page }) => {
    await page.goto('/chinese');
    await page.getByRole('button', { name: 'Flashcards' }).click();
    await expect(page.getByTestId('flashcard')).toBeAttached();

    // Category pills are the "All" button row above the card
    const allButton = page.getByRole('button', { name: 'All', exact: true });
    await expect(allButton).toBeVisible();
    const pillBox = await allButton.boundingBox();
    const cardBox = await page.getByTestId('flashcard').boundingBox();
    expect(pillBox).not.toBeNull();
    expect(cardBox).not.toBeNull();

    // The bottom edge of category pills must be above the top edge of the card
    expect(pillBox!.y + pillBox!.height).toBeLessThanOrEqual(cardBox!.y + 1);
  });

  test('flashcard does not overlap navigation buttons below', async ({ page }) => {
    await page.goto('/chinese');
    await page.getByRole('button', { name: 'Flashcards' }).click();
    await expect(page.getByTestId('flashcard')).toBeAttached();

    const nextButton = page.getByRole('button', { name: 'Next' });
    await expect(nextButton).toBeVisible();
    const buttonBox = await nextButton.boundingBox();
    const cardBox = await page.getByTestId('flashcard').boundingBox();
    expect(buttonBox).not.toBeNull();
    expect(cardBox).not.toBeNull();

    // The top edge of nav buttons must be below the bottom edge of the card
    expect(buttonBox!.y).toBeGreaterThanOrEqual(cardBox!.y + cardBox!.height - 1);
  });

  test('flipped flashcard back face stays within card bounds', async ({ page }) => {
    await page.goto('/chinese');
    await page.getByRole('button', { name: 'Flashcards' }).click();
    await expect(page.getByTestId('flashcard-character')).toBeVisible();

    // Flip the card
    await page.getByTestId('flashcard-character').click({ force: true });
    // Wait for flip animation to settle
    await page.waitForTimeout(600);

    const cardBox = await page.getByTestId('flashcard').boundingBox();
    expect(cardBox).not.toBeNull();

    // After flip, check pinyin and meaning are attached (backface-visibility)
    const pinyin = page.getByTestId('flashcard-pinyin');
    const meaning = page.getByTestId('flashcard-meaning');
    await expect(pinyin).toBeAttached();
    await expect(meaning).toBeAttached();

    // Verify the back face content stays within the card bounds visually.
    // We check bounding boxes rather than computed overflow because
    // perspective + preserve-3d can cause getComputedStyle to report
    // overflow differently than expected.
    const pinyinBox = await pinyin.boundingBox();
    const meaningBox = await meaning.boundingBox();
    if (pinyinBox) {
      expect(pinyinBox.y).toBeGreaterThanOrEqual(cardBox!.y - 1);
      expect(pinyinBox.y + pinyinBox.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height + 1);
    }
    if (meaningBox) {
      expect(meaningBox.y).toBeGreaterThanOrEqual(cardBox!.y - 1);
      expect(meaningBox.y + meaningBox.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height + 1);
    }
  });
});
