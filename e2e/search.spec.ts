import { test, expect } from './fixtures';

test.describe('City Search', () => {
  test('typing in search shows dropdown results', async ({ page }) => {
    await page.goto('/weather');

    const searchInput = page.getByPlaceholder(/search for a city/i);
    await searchInput.fill('London');

    // The dropdown should show "London" as a city name in a <p> with font-medium
    const dropdown = page.locator('.city-search-dropdown');
    await expect(dropdown.getByText('London', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('clicking a search result navigates to weather page', async ({ page }) => {
    await page.goto('/weather');

    const searchInput = page.getByPlaceholder(/search for a city/i);
    await searchInput.fill('London');

    // Wait for the dropdown and click the first result
    const dropdown = page.locator('.city-search-dropdown');
    await dropdown.getByText('London', { exact: true }).first().click({ timeout: 10_000 });

    // Should navigate to the weather page
    await expect(page).toHaveURL(/\/weather\//, { timeout: 10_000 });
  });

  test('keyboard navigation works in dropdown', async ({ page }) => {
    await page.goto('/weather');

    const searchInput = page.getByPlaceholder(/search for a city/i);
    await searchInput.fill('London');

    // Wait for dropdown results
    const dropdown = page.locator('.city-search-dropdown');
    await expect(dropdown.getByText('London', { exact: true }).first()).toBeVisible({ timeout: 10_000 });

    // Press ArrowDown + Enter to select
    await searchInput.press('ArrowDown');
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/\/weather\//, { timeout: 10_000 });
  });

  test('shows popular cities when input is focused with no text', async ({ page }) => {
    await page.goto('/weather');

    const searchInput = page.getByPlaceholder(/search for a city/i);
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.focus();

    // Should show popular cities dropdown (includes Tokyo, New York, etc.)
    await expect(page.getByText('Popular Cities')).toBeVisible({ timeout: 5_000 });
  });
});
