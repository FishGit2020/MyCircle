import { test, expect } from './fixtures';

test.describe('Crypto Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stocks');
  });

  test('shows crypto section heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /crypto/i });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('displays at least one crypto coin card', async ({ page }) => {
    const list = page.getByRole('list', { name: /crypto/i });
    await expect(list).toBeVisible({ timeout: 15000 });
    const items = list.getByRole('listitem');
    await expect(items.first()).toBeVisible({ timeout: 15000 });
  });

  test('crypto card shows symbol, name, and price', async ({ page }) => {
    // Wait for at least one coin to render
    const btcCard = page.getByRole('button', { name: /bitcoin/i });
    await expect(btcCard).toBeVisible({ timeout: 15000 });
    // Should show a $ price
    await expect(btcCard).toContainText('$');
  });

  test('expands crypto card on click to show market cap', async ({ page }) => {
    const btcCard = page.getByRole('button', { name: /bitcoin/i });
    await expect(btcCard).toBeVisible({ timeout: 15000 });
    await btcCard.click();

    await expect(page.getByText('Market Cap')).toBeVisible();
    await expect(page.getByText('24h Volume')).toBeVisible();
  });

  test('crypto section hides when a stock is selected', async ({ page }) => {
    // Wait for crypto section to appear
    const cryptoHeading = page.getByRole('heading', { name: /crypto/i });
    await expect(cryptoHeading).toBeVisible({ timeout: 10000 });

    // Search for and select a stock
    const searchInput = page.getByPlaceholderText(/search stocks/i);
    await searchInput.fill('AAPL');

    // Wait for search results and click first result
    const result = page.locator('[role="option"]').first();
    await expect(result).toBeVisible({ timeout: 10000 });
    await result.click();

    // Crypto section should be hidden when a stock is selected
    await expect(cryptoHeading).not.toBeVisible();
  });
});
