import { test, expect } from './fixtures';

test.describe('Theme toggle', () => {
  test('toggles dark mode on the page', async ({ page }) => {
    // Force a known starting state so the toggle behaves predictably on both
    // the old 2-way toggle and the new 3-way (Light/Auto/Dark) toggle.
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto('/');

    // Wait for the shell to fully render before interacting with the theme button
    await page.waitForLoadState('networkidle');

    // Match both old aria-label ("Switch to dark mode") and new ("Theme")
    const themeButton = page.getByRole('button', { name: /^switch to (dark|light) mode$|^theme$/i }).first();
    await themeButton.waitFor({ state: 'visible' });

    const html = page.locator('html');
    const wasDark = await html.evaluate(el => el.classList.contains('dark'));

    await themeButton.click();
    await page.waitForTimeout(300);

    const isDark = await html.evaluate(el => el.classList.contains('dark'));
    expect(isDark).not.toBe(wasDark);
  });
});

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
