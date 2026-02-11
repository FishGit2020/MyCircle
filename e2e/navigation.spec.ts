import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test('Home link returns to homepage', async ({ page }) => {
    await page.goto('/weather/51.5074,-0.1278?name=London');
    await page.getByRole('link', { name: 'Home' }).first().click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /Welcome to MyCircle/i })).toBeVisible();
  });

  test('clicking app title navigates to home', async ({ page }) => {
    await page.goto('/stocks');
    await page.getByRole('link', { name: /mycircle/i }).click();

    await expect(page).toHaveURL('/');
  });

  test('404 page for unknown routes', async ({ page }) => {
    await page.goto('/some-nonexistent-page');

    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Page not found')).toBeVisible();
  });

  test('Stocks link navigates to stocks page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Stocks' }).first().click();

    await expect(page).toHaveURL('/stocks');
  });

  test('Podcasts link navigates to podcasts page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Podcasts' }).first().click();

    await expect(page).toHaveURL('/podcasts');
  });

  test('AI link navigates to AI page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'AI' }).first().click();

    await expect(page).toHaveURL('/ai');
  });
});
