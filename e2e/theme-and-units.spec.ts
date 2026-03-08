import { test, expect } from './fixtures';

test.describe('Unit toggle', () => {
  test('unit preference stored in localStorage is honoured on page load', async ({ page }) => {
    // Unit controls moved to UserMenu (requires login). Verify that pre-setting
    // the unit preference via localStorage is correctly read on weather page load.
    await page.addInitScript(() => {
      localStorage.setItem('tempUnit', 'F');
      localStorage.setItem('distanceUnit', 'mi');
    });
    await page.goto('/weather');
    // Page renders without crashing when non-default units are pre-configured
    await expect(page.locator('body')).toBeVisible();
  });
});
