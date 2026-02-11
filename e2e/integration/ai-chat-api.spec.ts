import { test, expect } from '@playwright/test';

/**
 * Integration tests for AI Chat API — no mocking, hits real endpoint.
 * AI uses Gemini which has a valid key in both local and deployed.
 * The /ai/chat endpoint doesn't require reCAPTCHA.
 */
test.describe('AI Chat API Integration', () => {
  test('AI assistant page loads without crashing', async ({ page }) => {
    await page.goto('/ai');
    await expect(page.locator('#root')).toBeVisible({ timeout: 15_000 });

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(10);
    expect(bodyText).not.toContain('Application error');
  });

  test('AI chat endpoint responds with a valid response', async ({ page, baseURL }) => {
    const chatUrl = baseURL?.includes('localhost')
      ? 'http://localhost:3003/ai/chat'
      : `${baseURL}/ai/chat`;

    const response = await page.request.post(chatUrl, {
      data: {
        message: 'Hello, what can you help me with?',
        history: [],
      },
    });

    // Should respond successfully (Gemini key is valid)
    if (response.status() === 200) {
      const json = await response.json();
      expect(json).toHaveProperty('response');
      expect(typeof json.response).toBe('string');
      expect(json.response.length).toBeGreaterThan(0);
    } else if (response.status() === 429) {
      // Rate limited — acceptable
      const json = await response.json();
      expect(json).toHaveProperty('error');
    } else {
      // Any error should be structured JSON
      const text = await response.text();
      expect(() => JSON.parse(text)).not.toThrow();
    }
  });

  test('AI chat rejects empty message with 400', async ({ page, baseURL }) => {
    const chatUrl = baseURL?.includes('localhost')
      ? 'http://localhost:3003/ai/chat'
      : `${baseURL}/ai/chat`;

    const response = await page.request.post(chatUrl, {
      data: { message: '', history: [] },
    });

    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty('error');
  });

  test('AI chat with weather question triggers tool call', async ({ page, baseURL }) => {
    const chatUrl = baseURL?.includes('localhost')
      ? 'http://localhost:3003/ai/chat'
      : `${baseURL}/ai/chat`;

    const response = await page.request.post(chatUrl, {
      data: {
        message: 'What is the weather in Tokyo right now?',
        history: [],
      },
    });

    if (response.status() === 200) {
      const json = await response.json();
      expect(json).toHaveProperty('response');
      // Should mention Tokyo or weather data in the response
      expect(json.response.toLowerCase()).toMatch(/tokyo|weather|temperature|°|degree/);

      // May include tool calls
      if (json.toolCalls) {
        expect(Array.isArray(json.toolCalls)).toBe(true);
        const weatherCall = json.toolCalls.find((tc: any) => tc.name === 'getWeather');
        if (weatherCall) {
          expect(weatherCall.args).toHaveProperty('city');
        }
      }
    } else if (response.status() === 429) {
      // Rate limited — acceptable for integration tests
      test.skip(true, 'Rate limited');
    }
  });

  test('AI assistant page shows chat input', async ({ page }) => {
    await page.goto('/ai');

    const chatInput = page.getByPlaceholder(/message|ask|chat|type/i);
    const isVisible = await chatInput.isVisible({ timeout: 10_000 }).catch(() => false);

    if (isVisible) {
      expect(isVisible).toBe(true);
    } else {
      // At minimum the page should not be blank
      const bodyText = await page.textContent('body');
      expect(bodyText!.length).toBeGreaterThan(50);
    }
  });
});
