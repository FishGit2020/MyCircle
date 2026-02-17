import { test, expect } from './fixtures';

test.describe('Persistent Podcast Audio Player', () => {
  test('playing an episode and navigating to /stocks keeps the player visible', async ({ page }) => {
    await page.goto('/podcasts');

    // Wait for trending podcasts to load
    const firstCard = page.getByRole('button', { name: /^Trending Show 1 /i });
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();

    // Wait for episodes to load
    await expect(page.getByText(/Episode 1: Great Content/)).toBeVisible({ timeout: 10_000 });

    // Click the play button on the first episode
    const playButtons = page.getByRole('button', { name: /play episode/i });
    await playButtons.first().click();

    // Audio player should appear (now playing region in shell)
    await expect(page.getByRole('region', { name: /now playing/i })).toBeVisible({ timeout: 5_000 });

    // Navigate to stocks via SPA link (not page.goto which causes full reload and loses React state)
    await page.getByRole('navigation', { name: /main/i }).getByRole('button', { name: /daily/i }).click();
    await page.getByRole('menuitem', { name: /stocks/i }).click();
    await page.waitForURL('**/stocks');

    // Player should still be visible
    await expect(page.getByRole('region', { name: /now playing/i })).toBeVisible({ timeout: 5_000 });
  });

  test('closing player from another page hides it', async ({ page }) => {
    await page.goto('/podcasts');

    // Wait for trending podcasts to load
    const firstCard = page.getByRole('button', { name: /^Trending Show 1 /i });
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();

    // Wait for episodes and play
    await expect(page.getByText(/Episode 1: Great Content/)).toBeVisible({ timeout: 10_000 });
    const playButtons = page.getByRole('button', { name: /play episode/i });
    await playButtons.first().click();

    await expect(page.getByRole('region', { name: /now playing/i })).toBeVisible({ timeout: 5_000 });

    // Navigate to stocks via SPA link (not page.goto which causes full reload and loses React state)
    await page.getByRole('navigation', { name: /main/i }).getByRole('button', { name: /daily/i }).click();
    await page.getByRole('menuitem', { name: /stocks/i }).click();
    await page.waitForURL('**/stocks');

    // Close the player from the stocks page (use JS click to avoid desktop/mobile visibility issues)
    await page.locator('button[aria-label="Close player"]').first().dispatchEvent('click');

    // Player should no longer be visible
    await expect(page.getByRole('region', { name: /now playing/i })).not.toBeVisible({ timeout: 5_000 });
  });

  test('audio player has correct accessibility attributes', async ({ page }) => {
    await page.goto('/podcasts');

    // Navigate to a podcast and play an episode
    const firstCard = page.getByRole('button', { name: /^Trending Show 1 /i });
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();

    await expect(page.getByText(/Episode 1: Great Content/)).toBeVisible({ timeout: 10_000 });
    const playButtons = page.getByRole('button', { name: /play episode/i });
    await playButtons.first().click();

    await expect(page.getByRole('region', { name: /now playing/i })).toBeVisible({ timeout: 5_000 });

    // Verify the seek slider has proper ARIA attributes
    const slider = page.getByRole('slider', { name: /seek position/i });
    await expect(slider).toBeVisible();
    await expect(slider).toHaveAttribute('aria-valuenow');
    await expect(slider).toHaveAttribute('aria-valuemin', '0');
    await expect(slider).toHaveAttribute('aria-valuemax');

    // Verify playback controls exist
    await expect(page.getByRole('button', { name: /skip back/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /skip forward/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /pause episode|play episode/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /close player/i }).first()).toBeVisible();
  });
});
