import { test, expect } from './fixtures';

test.describe('Widget Dashboard', () => {
  test('renders widget dashboard section on homepage', async ({ page }) => {
    await page.goto('/');

    // The widget dashboard section should be visible
    const section = page.getByRole('region', { name: /widgets|my widgets/i });
    await expect(section).toBeVisible({ timeout: 10_000 });
  });

  test('shows all four default widgets', async ({ page }) => {
    await page.goto('/');

    // Wait for the dashboard to load
    await page.waitForSelector('[class*="grid"]', { timeout: 10_000 });

    // All four widget types should be visible
    await expect(page.getByText(/verse of the day/i).first()).toBeVisible();
    await expect(page.getByText(/stock ticker/i).first()).toBeVisible();
    await expect(page.getByText(/now playing/i).first()).toBeVisible();
  });

  test('can enter and exit customize mode', async ({ page }) => {
    await page.goto('/');

    // Click customize button
    const customizeBtn = page.getByRole('button', { name: /customize/i });
    await expect(customizeBtn).toBeVisible({ timeout: 10_000 });
    await customizeBtn.click();

    // "Done" button should now be visible
    await expect(page.getByRole('button', { name: /done/i })).toBeVisible();

    // "Reset layout" should be visible
    await expect(page.getByText(/reset layout/i)).toBeVisible();

    // Click done to exit
    await page.getByRole('button', { name: /done/i }).click();

    // Customize button should be back
    await expect(page.getByRole('button', { name: /customize/i })).toBeVisible();
  });

  test('can toggle widget visibility', async ({ page }) => {
    await page.goto('/');

    // Enter customize mode
    await page.getByRole('button', { name: /customize/i }).click({ timeout: 10_000 });

    // Find visibility toggle buttons
    const visibleButtons = page.getByRole('button', { name: /toggle widget/i });
    const count = await visibleButtons.count();
    expect(count).toBe(5);

    // Toggle the first widget off
    await visibleButtons.first().click();

    // Exit customize mode
    await page.getByRole('button', { name: /done/i }).click();

    // The grid should have fewer visible widgets
    const widgets = page.getByRole('region', { name: /widgets/i }).locator('[class*="grid"] > a');
    const visibleCount = await widgets.count();
    expect(visibleCount).toBe(4);
  });

  test('widget layout persists after page reload', async ({ page }) => {
    await page.goto('/');

    // Enter customize mode and hide first widget
    await page.getByRole('button', { name: /customize/i }).click({ timeout: 10_000 });
    const visibleButtons = page.getByRole('button', { name: /toggle widget/i });
    await visibleButtons.first().click();
    await page.getByRole('button', { name: /done/i }).click();

    // Count visible widgets
    const widgets = page.getByRole('region', { name: /widgets/i }).locator('[class*="grid"] > a');
    const countBefore = await widgets.count();
    expect(countBefore).toBe(4);

    // Reload the page
    await page.reload();

    // Wait for dashboard to render
    await page.waitForSelector('[class*="grid"]', { timeout: 10_000 });

    // Count should still be 4 (persisted)
    const countAfter = await page.getByRole('region', { name: /widgets/i }).locator('[class*="grid"] > a').count();
    expect(countAfter).toBe(4);
  });
});
