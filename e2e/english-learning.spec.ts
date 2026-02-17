import { test, expect } from './fixtures';

test.describe('English Learning', () => {
  test('navigates to /english and shows the title', async ({ page }) => {
    await page.goto('/english');
    await expect(page.getByText('Learn English')).toBeVisible();
  });

  test('shows lesson view by default with a phrase', async ({ page }) => {
    await page.goto('/english');
    await expect(page.getByTestId('phrase-english')).toBeVisible();
    await expect(page.getByTestId('phrase-chinese')).toBeVisible();
  });

  test('can mark a phrase as completed', async ({ page }) => {
    await page.goto('/english');
    await page.getByTestId('got-it-btn').click();
    await expect(page.getByText(/Progress: 1 \//)).toBeVisible();
  });

  test('can navigate between phrases', async ({ page }) => {
    await page.goto('/english');
    const firstPhrase = await page.getByTestId('phrase-english').textContent();
    await page.getByText('Next').click();
    const secondPhrase = await page.getByTestId('phrase-english').textContent();
    expect(firstPhrase).not.toBe(secondPhrase);
  });

  test('switches to quiz view', async ({ page }) => {
    await page.goto('/english');
    await page.getByRole('button', { name: 'Quiz' }).click();
    await expect(page.getByTestId('quiz-question')).toBeVisible();
  });

  test('quiz shows 4 options', async ({ page }) => {
    await page.goto('/english');
    await page.getByRole('button', { name: 'Quiz' }).click();
    const options = page.getByTestId('quiz-option');
    await expect(options).toHaveCount(4);
  });

  test('switches to progress dashboard', async ({ page }) => {
    await page.goto('/english');
    // Click the "Progress" tab (not the inline "Progress: 0/78" text)
    await page.getByRole('button', { name: 'Progress' }).click();
    await expect(page.getByTestId('total-completed')).toBeVisible();
    await expect(page.getByTestId('streak-count')).toBeVisible();
  });

  test('completed progress persists via localStorage', async ({ page }) => {
    await page.goto('/english');
    await page.getByTestId('got-it-btn').click();

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByText(/Progress: 1 \//)).toBeVisible();
  });

  test('category filter changes displayed phrases', async ({ page }) => {
    await page.goto('/english');
    await page.getByText('Emergencies').click();
    await expect(page.getByTestId('phrase-english')).toHaveText('Help!');
  });
});
