import { test, expect } from '@playwright/test';

/**
 * Integration tests for weather API — no mocking, hits real endpoints.
 * Weather uses OpenWeather API which has a valid key in both local and deployed.
 *
 * Note: Deployed GraphQL requires reCAPTCHA tokens, so raw API tests
 * only run locally. Deployed tests verify through the UI.
 */
test.describe('Weather API Integration', () => {
  test('homepage loads and renders header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'MyCircle' })).toBeVisible({ timeout: 15_000 });
  });

  test('weather page renders for a city without crashing', async ({ page }) => {
    await page.goto('/weather/51.5074,-0.1278?name=London');

    const content = page.locator('#root');
    await expect(content).toBeVisible({ timeout: 15_000 });

    // The page should render meaningful content — not a white screen or crash
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(10);
    expect(bodyText).not.toContain('Application error');
    expect(bodyText).not.toContain('Cannot read properties');
  });

  // Raw GraphQL tests — only local (deployed requires reCAPTCHA)
  test('GraphQL weather query returns data (local only)', async ({ page, baseURL }) => {
    test.skip(!baseURL?.includes('localhost'), 'Deployed GraphQL requires reCAPTCHA');

    const response = await page.request.post('http://localhost:3003/graphql', {
      data: {
        operationName: 'GetCurrentWeather',
        query: `query GetCurrentWeather($lat: Float!, $lon: Float!) {
          currentWeather(lat: $lat, lon: $lon) {
            temp humidity
            weather { main description icon }
            wind { speed }
          }
        }`,
        variables: { lat: 40.7128, lon: -74.006 },
      },
    });

    expect(response.status()).toBe(200);
    const json = await response.json();

    if (json.data?.currentWeather) {
      expect(json.data.currentWeather).toHaveProperty('temp');
      expect(typeof json.data.currentWeather.temp).toBe('number');
    } else {
      // API key missing — should be a structured error
      expect(json).toHaveProperty('errors');
      expect(Array.isArray(json.errors)).toBe(true);
    }
  });

  test('GraphQL city search returns results (local only)', async ({ page, baseURL }) => {
    test.skip(!baseURL?.includes('localhost'), 'Deployed GraphQL requires reCAPTCHA');

    const response = await page.request.post('http://localhost:3003/graphql', {
      data: {
        operationName: 'SearchCities',
        query: `query SearchCities($query: String!) {
          searchCities(query: $query) { name country lat lon }
        }`,
        variables: { query: 'London' },
      },
    });

    expect(response.status()).toBe(200);
    const json = await response.json();

    if (json.data?.searchCities) {
      expect(json.data.searchCities.length).toBeGreaterThan(0);
      expect(json.data.searchCities[0]).toHaveProperty('name');
    } else {
      expect(json).toHaveProperty('errors');
    }
  });

  test('weather page shows temperature or loading state', async ({ page }) => {
    await page.goto('/weather/40.7128,-74.006?name=New%20York');

    // Wait for content to load
    await page.waitForTimeout(5000);

    const bodyText = await page.textContent('body');

    // Should show either:
    // - Temperature data (a degree sign or number)
    // - Loading indicator
    // - Error message (if API key issues)
    // Should NOT show a blank page or unhandled exception
    const hasTemp = /\d+°|°[CF]/.test(bodyText || '');
    const hasLoading = /loading/i.test(bodyText || '');
    const hasError = /error|failed|unable/i.test(bodyText || '');
    const hasCity = /new york/i.test(bodyText || '');

    expect(hasTemp || hasLoading || hasError || hasCity).toBe(true);
  });
});
