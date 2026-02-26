import { test, expect } from './fixtures';

test.describe('Stock Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stocks');
  });

  test('renders stock tracker page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /stock tracker/i })).toBeVisible({ timeout: 15_000 });
  });

  test('has a stock search input', async ({ page }) => {
    await expect(page.getByPlaceholder(/search stocks/i)).toBeVisible({ timeout: 15_000 });
  });

  test('shows watchlist section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /watchlist/i })).toBeVisible({ timeout: 15_000 });
  });

  test('shows empty watchlist message', async ({ page }) => {
    await expect(page.getByText(/no stocks in your watchlist/i)).toBeVisible({ timeout: 15_000 });
  });

  test('typing in search shows stock results', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    await searchInput.fill('AAPL');

    // Wait for mock search results to appear
    await expect(page.getByText('Apple Inc').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('AAPL').first()).toBeVisible();
  });

  test('selecting a stock shows quote details', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    await searchInput.fill('AAPL');

    // Click the first result
    await page.getByText('Apple Inc').first().click({ timeout: 10_000 });

    // Should show the stock quote with price
    await expect(page.getByText('$185.92')).toBeVisible({ timeout: 10_000 });
  });

  test('stock detail shows Open, High, Low, Prev Close', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    await searchInput.fill('AAPL');

    await page.getByText('Apple Inc').first().click({ timeout: 10_000 });

    // Wait for quote to load, then verify detail labels within main content
    await expect(page.getByText('$185.92')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Open', { exact: true })).toBeVisible();
    await expect(page.getByText('High', { exact: true })).toBeVisible();
    await expect(page.getByText('Low', { exact: true })).toBeVisible();
    await expect(page.getByText('Prev Close')).toBeVisible();
  });

  test('can navigate back from stock detail', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    await searchInput.fill('AAPL');

    await page.getByText('Apple Inc').first().click({ timeout: 10_000 });
    await expect(page.getByText('$185.92')).toBeVisible({ timeout: 10_000 });

    // Click breadcrumb link to navigate back
    await page.getByRole('link', { name: /stocks/i }).click();

    // Should see watchlist section again
    await expect(page.getByRole('heading', { name: /watchlist/i })).toBeVisible();
  });
});
