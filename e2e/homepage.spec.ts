import { test, expect } from './fixtures';

test.describe('Homepage / Dashboard', () => {
  test('renders header with app title and navigation', async ({ page }) => {
    await page.goto('/');

    // App title (mobile + desktop h1 exist; target the visible one)
    await expect(page.locator('h1:visible').first()).toContainText('MyCircle');

    // Navigation dropdown groups visible in desktop header
    await expect(page.getByRole('button', { name: 'Daily' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Faith' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Family' }).first()).toBeVisible();
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
