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

  test('footer credits OpenWeatherMap, Finnhub, and PodcastIndex', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('footer')).toContainText('OpenWeatherMap');
    await expect(page.locator('footer')).toContainText('Finnhub');
    await expect(page.locator('footer')).toContainText('PodcastIndex');
  });

});
