import { test, expect } from './fixtures';

test.describe('Weather Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to a weather page with mock coordinates
    await page.goto('/weather/51.5074,-0.1278?name=London');
  });

  test('shows city name', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'London' })).toBeVisible({ timeout: 15_000 });
  });

  test('displays current temperature', async ({ page }) => {
    // Wait for weather data to load, then check for a temperature value
    await expect(page.getByText('Humidity')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/\-?\d+°[CF]/).first()).toBeVisible();
  });

  test('shows weather details like humidity and wind', async ({ page }) => {
    // Verify that the humidity label and a percentage value render
    await expect(page.getByText('Humidity')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/\d+%/).first()).toBeVisible({ timeout: 15_000 });
  });

  test('displays hourly forecast section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /hourly forecast/i })).toBeVisible({ timeout: 15_000 });
  });

  test('displays 7-day forecast section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /7-day forecast/i })).toBeVisible({ timeout: 15_000 });
  });

  test('shows sunrise/sunset section', async ({ page }) => {
    await expect(page.getByText(/sunrise/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/sunset/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('shows "What to Wear" suggestions', async ({ page }) => {
    await expect(page.getByText(/what to wear/i)).toBeVisible({ timeout: 15_000 });
  });

  test('shows weather map section', async ({ page }) => {
    await expect(page.getByText(/weather map/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('share button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /share/i })).toBeVisible({ timeout: 15_000 });
  });
});
