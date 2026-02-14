import { test, expect } from './fixtures';

test.describe('City Search Autocomplete with Recents', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/weather');
    await page.waitForSelector('input[role="combobox"]', { timeout: 30000 });
  });

  test('shows popular cities on focus when no recents exist', async ({ page }) => {
    const input = page.locator('input[role="combobox"]');
    await input.focus();
    await expect(page.getByText('Popular Cities')).toBeVisible({ timeout: 5000 });
  });

  test('search returns results with weather preview', async ({ page }) => {
    const input = page.locator('input[role="combobox"]');
    await input.fill('London');
    await expect(page.locator('[role="listbox"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[role="option"]').first()).toBeVisible();
  });

  test('selecting a city saves it to localStorage recents', async ({ page }) => {
    const input = page.locator('input[role="combobox"]');
    await input.fill('Paris');
    await page.waitForSelector('[role="option"]', { timeout: 10000 });
    await page.locator('[role="option"]').first().click();

    // Navigate back to weather page
    await page.goto('/weather');
    await page.waitForSelector('input[role="combobox"]', { timeout: 30000 });

    // Focus input - should show "Recent Searches" with Paris
    await page.locator('input[role="combobox"]').focus();
    await expect(page.getByText('Recent Searches')).toBeVisible({ timeout: 5000 });
  });

  test('Escape closes dropdown', async ({ page }) => {
    const input = page.locator('input[role="combobox"]');
    await input.focus();
    await expect(page.getByText('Popular Cities')).toBeVisible({ timeout: 5000 });
    await input.press('Escape');
    await expect(page.getByText('Popular Cities')).not.toBeVisible();
  });

  test('keyboard navigation works in dropdown', async ({ page }) => {
    const input = page.locator('input[role="combobox"]');
    await input.focus();
    await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: 5000 });

    await input.press('ArrowDown');
    const firstOption = page.locator('[role="option"]').first();
    await expect(firstOption).toHaveAttribute('aria-selected', 'true');
  });
});
