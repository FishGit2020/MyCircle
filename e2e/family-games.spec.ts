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

  test('shows game selector grid with 5 games', async ({ page }) => {
    // Wait for the game text to appear confirming MFE loaded
    await expect(page.getByText(/trivia quiz|trivia/i).first()).toBeVisible({ timeout: 20_000 });
    // Verify all 5 game titles are visible somewhere on the page
    await expect(page.getByText(/math challenge|math/i).first()).toBeVisible();
    await expect(page.getByText(/word game|word/i).first()).toBeVisible();
    await expect(page.getByText(/memory match|memory/i).first()).toBeVisible();
    await expect(page.getByText(/heads up/i).first()).toBeVisible();
  });

  test('shows scoreboard section', async ({ page }) => {
    const scoreboard = page.getByText(/scoreboard|marcador|记分/i);
    await expect(scoreboard.first()).toBeVisible({ timeout: 20_000 });
  });
});
