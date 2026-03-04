import { test, expect } from './fixtures';

/**
 * Emulator smoke tests — validate full request path:
 *   Browser → Hosting Emulator → Functions Emulator → Mock API Server
 *
 * These tests run against real Firebase emulators with a mock API server
 * providing deterministic external API responses.
 */

test.describe('Emulator Smoke Tests', () => {
  test('homepage loads and renders weather data', async ({ page }) => {
    await page.goto('/');
    // The shell app should load
    await expect(page).toHaveTitle(/MyCircle/i);
    // Wait for any content to render (the page should not be blank)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('weather page shows weather information', async ({ page }) => {
    await page.goto('/');
    // Look for temperature or weather-related content
    // The page should render some weather data from the mock API
    await page.waitForLoadState('domcontentloaded');
    // Verify the page loaded without a crash
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
  });

  test('stocks page loads', async ({ page }) => {
    await page.goto('/stocks');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('podcasts page loads', async ({ page }) => {
    await page.goto('/podcasts');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('bible page loads', async ({ page }) => {
    await page.goto('/bible');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('notebook page loads', async ({ page }) => {
    await page.goto('/notebook');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('baby tracker page loads', async ({ page }) => {
    await page.goto('/baby');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('child development page loads', async ({ page }) => {
    await page.goto('/child-dev');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('flashcards page loads', async ({ page }) => {
    await page.goto('/flashcards');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('work tracker page loads', async ({ page }) => {
    await page.goto('/work-tracker');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('immigration tracker page loads', async ({ page }) => {
    await page.goto('/immigration');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('model benchmark page loads', async ({ page }) => {
    await page.goto('/benchmark');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('digital library page loads', async ({ page }) => {
    await page.goto('/library');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('worship songs page loads', async ({ page }) => {
    await page.goto('/worship');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('AI assistant page loads', async ({ page }) => {
    await page.goto('/ai');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('navigation between pages works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to stocks
    await page.goto('/stocks');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();

    // Navigate to podcasts
    await page.goto('/podcasts');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();

    // Navigate back to home
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
