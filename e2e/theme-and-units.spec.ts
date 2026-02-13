import { test, expect } from './fixtures';

test.describe('Theme toggle', () => {
  test('toggles dark mode on the page', async ({ page }) => {
    await page.goto('/');

    // Both desktop and mobile navs render the theme toggle; pick the first visible one
    const themeButton = page.getByRole('button', { name: /switch to (dark|light) mode/i }).first();

    const html = page.locator('html');
    const wasDark = await html.evaluate(el => el.classList.contains('dark'));

    await themeButton.click();
    await page.waitForTimeout(300);

    const isDark = await html.evaluate(el => el.classList.contains('dark'));
    expect(isDark).not.toBe(wasDark);
  });
});

test.describe('Unit toggle', () => {
  test('switches between Celsius and Fahrenheit', async ({ page }) => {
    // Unit toggles are now on weather pages, not the global header
    await page.goto('/weather');

    const unitButton = page.getByRole('button', { name: /°[CF]/ }).first();
    await expect(unitButton).toBeVisible();

    const initialText = await unitButton.textContent();

    await unitButton.click();
    await page.waitForTimeout(300);

    const newText = await unitButton.textContent();
    expect(newText).not.toBe(initialText);
  });
});
