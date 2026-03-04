import { test, expect } from './fixtures';

test.describe('Family Games', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/family-games');
  });

  test('renders page without crash', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('breadcrumb shows Family Games', async ({ page }) => {
    await expect(page.getByText('Family Games').first()).toBeVisible({ timeout: 15_000 });
  });

  test('shows page title or loading state', async ({ page }) => {
    // MFE loads asynchronously — either the title appears or loading state is visible
    const title = page.getByRole('heading', { name: /family games|juegos|游戏/i }).first();
    const loading = page.getByText(/loading/i).first();
    await expect(title.or(loading)).toBeVisible({ timeout: 20_000 });
  });

  test('shows game selector cards', async ({ page }) => {
    // Wait for the game cards to load
    const triviaCard = page.getByRole('button', { name: /trivia/i });
    await expect(triviaCard).toBeVisible({ timeout: 20_000 });

    // All 5 game types should be visible
    await expect(page.getByRole('button', { name: /math/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /word/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /memory/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /heads up/i })).toBeVisible();
  });

  test('shows scoreboard section', async ({ page }) => {
    const scoreboard = page.getByText(/scoreboard|marcador|记分/i);
    await expect(scoreboard.first()).toBeVisible({ timeout: 20_000 });
  });
});
