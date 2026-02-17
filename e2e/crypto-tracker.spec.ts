import { test, expect } from './fixtures';

test.describe('Crypto Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stocks');
  });

  test('shows crypto section heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /crypto/i });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('displays Bitcoin card', async ({ page }) => {
    const btcText = page.getByText('BTC');
    await expect(btcText).toBeVisible({ timeout: 15000 });
  });

  test('Bitcoin card shows price', async ({ page }) => {
    const card = page.locator('[aria-label*="Bitcoin"]');
    await expect(card).toBeVisible({ timeout: 15000 });
    await expect(card).toContainText('$');
  });

  test('crypto section hides when a stock is selected', async ({ page }) => {
    // Wait for crypto section to appear
    const cryptoHeading = page.getByRole('heading', { name: /crypto/i });
    await expect(cryptoHeading).toBeVisible({ timeout: 10000 });

    // Search for and select a stock
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill('AAPL');

    // Wait for search results and click first result
    const result = page.locator('[role="option"]').first();
    await expect(result).toBeVisible({ timeout: 10000 });
    await result.click();

    // Crypto section should be hidden when a stock is selected
    await expect(cryptoHeading).not.toBeVisible();
  });
});
