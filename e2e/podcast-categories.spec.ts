import { test, expect } from './fixtures';

test.describe('Podcast Categories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/podcasts');
    // Wait for trending to load
    await expect(page.getByRole('heading', { name: 'Trending Show 1', exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test('renders category filter chips from trending data', async ({ page }) => {
    // "All" chip should be visible
    const allChip = page.getByRole('button', { name: 'All' });
    await expect(allChip).toBeVisible();

    // Trending mock data has categories like Technology, Science, News, etc.
    await expect(page.getByRole('button', { name: 'Technology' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Science' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'News' })).toBeVisible();
  });

  test('clicking a category chip filters the podcast grid', async ({ page }) => {
    // Click on Technology chip
    await page.getByRole('button', { name: 'Technology' }).click();

    // Should show podcasts with Technology category (Trending Show 1 and 4)
    await expect(page.getByRole('heading', { name: 'Trending Show 1', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Trending Show 4', exact: true })).toBeVisible();

    // Should NOT show podcasts without Technology (e.g., Trending Show 2 has News, Politics)
    await expect(page.getByRole('heading', { name: 'Trending Show 2', exact: true })).not.toBeVisible();
  });

  test('clicking "All" chip resets the filter', async ({ page }) => {
    // Filter first
    await page.getByRole('button', { name: 'Technology' }).click();
    await expect(page.getByRole('heading', { name: 'Trending Show 2', exact: true })).not.toBeVisible();

    // Reset
    await page.getByRole('button', { name: 'All' }).click();
    await expect(page.getByRole('heading', { name: 'Trending Show 2', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Trending Show 1', exact: true })).toBeVisible();
  });

  test('podcast cards display category badges', async ({ page }) => {
    // Category badges should be visible on cards (purple chips)
    // Trending Show 1 has "Technology, Science"
    const card = page.getByRole('button', { name: /Trending Show 1/ }).first();
    await expect(card).toBeVisible();

    // The card should contain category badge text
    await expect(card.getByText('Technology')).toBeVisible();
    await expect(card.getByText('Science')).toBeVisible();
  });

  test('heading shows selected category name', async ({ page }) => {
    // Initially shows "Trending"
    await expect(page.getByRole('heading', { level: 2, name: 'Trending' })).toBeVisible();

    // Click a category
    await page.getByRole('button', { name: 'Comedy' }).click();

    // Heading should change to category name
    await expect(page.getByRole('heading', { level: 2, name: 'Comedy' })).toBeVisible();
  });
});
