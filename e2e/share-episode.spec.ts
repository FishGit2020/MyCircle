import { test, expect } from './fixtures';

test.describe('Share Episode Clip', () => {
  test('audio player has share button when episode is playing', async ({ page }) => {
    await page.goto('/podcasts');

    // Wait for trending to load then click a podcast
    const firstCard = page.getByRole('button', { name: /^Trending Show 1 /i });
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();

    // Wait for episode list then click an episode play button
    await expect(page.getByText(/Episode 1: Great Content/)).toBeVisible({ timeout: 10_000 });
    const episodeItem = page.getByText(/Episode 1: Great Content/).first();
    await episodeItem.click();

    // The global audio player should appear with a share button
    const shareButton = page.getByRole('button', { name: /share episode/i });
    await expect(shareButton.first()).toBeVisible({ timeout: 5_000 });
  });

  test('share button exists in audio player region', async ({ page }) => {
    await page.goto('/podcasts');

    const firstCard = page.getByRole('button', { name: /^Trending Show 1 /i });
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();

    await expect(page.getByText(/Episode 1: Great Content/)).toBeVisible({ timeout: 10_000 });
    await page.getByText(/Episode 1: Great Content/).first().click();

    // The player region should contain the share button
    const playerRegion = page.getByRole('region', { name: /now playing/i });
    await expect(playerRegion.first()).toBeVisible({ timeout: 5_000 });
    await expect(playerRegion.first().getByRole('button', { name: /share episode/i }).first()).toBeVisible();
  });

  test('share button has correct aria-label', async ({ page }) => {
    await page.goto('/podcasts');

    const firstCard = page.getByRole('button', { name: /^Trending Show 1 /i });
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();

    await expect(page.getByText(/Episode 1: Great Content/)).toBeVisible({ timeout: 10_000 });
    await page.getByText(/Episode 1: Great Content/).first().click();

    const shareButton = page.getByRole('button', { name: /share episode/i });
    await expect(shareButton.first()).toBeVisible({ timeout: 5_000 });
    await expect(shareButton.first()).toHaveAttribute('aria-label', 'Share episode');
  });
});
