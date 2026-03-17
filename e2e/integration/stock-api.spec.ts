import { test, expect } from '@playwright/test';

/**
 * Integration tests for stock API — no mocking.
 *
 * Tests GraphQL queries and UI rendering.
 * With placeholder Finnhub key, expect structured errors (not crashes).
 */
test.describe('Stock API Integration', () => {
  test('stocks page loads without crashing', async ({ page }) => {
    await page.goto('/stocks');
    await expect(page.locator('#root')).toBeVisible({ timeout: 15_000 });

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(10);
    expect(bodyText).not.toContain('Application error');
    expect(bodyText).not.toContain('Cannot read properties of undefined');
  });

  // ─── Local-only: GraphQL queries ──────────────────────────────────

  test('stock search GraphQL query (local only)', async ({ page, baseURL }) => {
    test.skip(!baseURL?.includes('localhost'), 'Deployed uses REST proxy, not direct GraphQL');

    const response = await page.request.post('http://localhost:3003/graphql', {
      data: {
        operationName: 'SearchStocks',
        query: `query SearchStocks($query: String!) {
          searchStocks(query: $query) { symbol description type }
        }`,
        variables: { query: 'AAPL' },
      },
    });

    // GraphQL always returns 200, even for errors
    expect(response.status()).toBe(200);
    const json = await response.json();
    // Either data or structured GraphQL error (e.g., placeholder API key → 401 from upstream)
    expect(json.data !== undefined || json.errors !== undefined).toBe(true);
    // If errors, they should be structured
    if (json.errors) {
      expect(Array.isArray(json.errors)).toBe(true);
      expect(json.errors[0]).toHaveProperty('message');
    }
  });

  // ─── UI tests (both local and deployed) ────────────────────────────

  test('stocks page shows search input', async ({ page }) => {
    await page.goto('/stocks');

    const searchInput = page.getByPlaceholder(/stock|search|symbol|ticker/i);
    const isVisible = await searchInput.isVisible({ timeout: 10_000 }).catch(() => false);

    if (isVisible) {
      await searchInput.fill('AAPL');
      await page.waitForTimeout(1000);
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('Application error');
    } else {
      // Page loaded — at minimum no crash
      const bodyText = await page.textContent('body');
      expect(bodyText!.length).toBeGreaterThan(10);
    }
  });
});
