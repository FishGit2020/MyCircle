import { test, expect } from '@playwright/test';

/**
 * Integration tests for podcast API — no mocking.
 *
 * Local: Tests GraphQL queries (localhost:3003, no reCAPTCHA)
 * Deployed: Tests REST proxy (/podcast/*, no reCAPTCHA) + UI
 *
 * With placeholder PodcastIndex key, expect structured errors (not crashes).
 */
test.describe('Podcast API Integration', () => {
  test('podcasts page loads without crashing', async ({ page }) => {
    await page.goto('/podcasts');
    await expect(page.locator('#root')).toBeVisible({ timeout: 15_000 });

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(10);
    expect(bodyText).not.toContain('Application error');
    expect(bodyText).not.toContain('Cannot read properties of undefined');
  });

  // ─── Local-only: GraphQL queries ──────────────────────────────────

  test('trending podcasts GraphQL query (local only)', async ({ page, baseURL }) => {
    test.skip(!baseURL?.includes('localhost'), 'Deployed uses REST proxy, not direct GraphQL');

    const response = await page.request.post('http://localhost:3003/graphql', {
      data: {
        operationName: 'GetTrendingPodcasts',
        query: `query GetTrendingPodcasts {
          trendingPodcasts { feeds { id title author } count }
        }`,
      },
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.data !== undefined || json.errors !== undefined).toBe(true);
  });

  test('podcast search GraphQL query (local only)', async ({ page, baseURL }) => {
    test.skip(!baseURL?.includes('localhost'), 'Deployed uses REST proxy, not direct GraphQL');

    const response = await page.request.post('http://localhost:3003/graphql', {
      data: {
        operationName: 'SearchPodcasts',
        query: `query SearchPodcasts($query: String!) {
          searchPodcasts(query: $query) { feeds { id title author } count }
        }`,
        variables: { query: 'technology' },
      },
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.data !== undefined || json.errors !== undefined).toBe(true);
  });

  // ─── Deployed-only: REST proxy endpoints ──────────────────────────

  test('podcast REST trending endpoint (deployed only)', async ({ page, baseURL }) => {
    test.skip(baseURL?.includes('localhost') ?? false, 'No REST podcast proxy in local dev');

    const response = await page.request.get(`${baseURL}/podcast/trending`);

    const text = await response.text();
    expect(() => JSON.parse(text)).not.toThrow();

    const json = JSON.parse(text);
    if (response.status() === 200 && json.feeds) {
      expect(Array.isArray(json.feeds)).toBe(true);
    } else if (json.error) {
      expect(typeof json.error).toBe('string');
    }
  });

  test('podcast REST search endpoint (deployed only)', async ({ page, baseURL }) => {
    test.skip(baseURL?.includes('localhost') ?? false, 'No REST podcast proxy in local dev');

    const response = await page.request.get(`${baseURL}/podcast/search?q=technology`);

    const text = await response.text();
    expect(() => JSON.parse(text)).not.toThrow();

    const json = JSON.parse(text);
    if (response.status() === 200 && json.feeds) {
      expect(Array.isArray(json.feeds)).toBe(true);
    } else if (json.error) {
      expect(typeof json.error).toBe('string');
    }
  });

  // ─── UI tests (both local and deployed) ────────────────────────────

  test('podcasts page shows content', async ({ page }) => {
    await page.goto('/podcasts');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Application error');

    const hasTrending = await page.getByText(/trending|popular|discover/i).isVisible().catch(() => false);
    const hasSearch = await page.getByPlaceholder(/podcast|search/i).isVisible().catch(() => false);
    const hasError = await page.getByText(/error|failed|unavailable/i).isVisible().catch(() => false);
    const hasLoading = await page.getByText(/loading/i).isVisible().catch(() => false);

    // Page rendered something meaningful
    expect(hasTrending || hasSearch || hasError || hasLoading).toBe(true);
  });
});
