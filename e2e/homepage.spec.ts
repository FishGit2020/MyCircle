import { test, expect } from './fixtures';

test.describe('Homepage / Dashboard', () => {
  test('renders header with app title and navigation', async ({ page }) => {
    await page.goto('/');

    // App title
    await expect(page.locator('h1')).toContainText('MyCircle');

    // Navigation links — Home replaces Weather, Compare is removed from nav
    await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Stocks' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Podcasts' }).first()).toBeVisible();
  });

  test('shows hero section with welcome message', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Welcome to MyCircle/i })).toBeVisible();
  });

  test('has a city search input on the weather page', async ({ page }) => {
    await page.goto('/weather');

    const searchInput = page.getByPlaceholder(/search for a city/i);
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
  });

  test('shows "Use My Location" button on the weather page', async ({ page }) => {
    await page.goto('/weather');

    await expect(page.getByRole('button', { name: /use my.*location/i })).toBeVisible();
  });

  test('shows quick access cards for Weather, Stocks, Podcasts, AI', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Quick Access')).toBeVisible();
    await expect(page.getByRole('link', { name: /Weather/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Stocks/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Podcasts/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /AI Assistant/i }).first()).toBeVisible();
  });

  test('footer credits OpenWeatherMap, Finnhub, and PodcastIndex', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('footer')).toContainText('OpenWeatherMap');
    await expect(page.locator('footer')).toContainText('Finnhub');
    await expect(page.locator('footer')).toContainText('PodcastIndex');
  });

  test('quick access cards navigate to correct pages', async ({ page }) => {
    await page.goto('/');

    // Click on Stocks card and verify navigation
    await page.getByRole('link', { name: /Stocks/i }).first().click();
    await expect(page).toHaveURL(/\/stocks/);
  });

  test('tile layout remains stable after navigation', async ({ page }) => {
    await page.goto('/');

    // Get initial grid column count
    const grid = page.locator('.grid').first();
    const initialCols = await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns);

    // Navigate away to a different page
    await page.getByRole('link', { name: /Stocks/i }).first().click();
    await expect(page).toHaveURL(/\/stocks/);

    // Navigate back to home via browser back (avoids desktop/mobile nav visibility issues)
    await page.goBack();
    await expect(page).toHaveURL('/');

    // Verify grid layout is the same
    const afterCols = await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    expect(afterCols).toBe(initialCols);
  });
});
