import { test as base, type Page } from '@playwright/test';
import { mockGraphQL, mockStockAPI, mockPodcastAPI, mockAiChatAPI } from './fixtures';

const PAGES = [
  { path: '/', name: 'dashboard' },
  { path: '/weather', name: 'weather' },
  { path: '/stocks', name: 'stocks' },
  { path: '/podcasts', name: 'podcasts' },
  { path: '/radio', name: 'radio' },
  { path: '/transit', name: 'transit' },
  { path: '/deals', name: 'deals' },
  { path: '/bible', name: 'bible' },
  { path: '/worship', name: 'worship' },
  { path: '/baby', name: 'baby' },
  { path: '/child-dev', name: 'child-dev' },
  { path: '/immigration', name: 'immigration' },
  { path: '/family-games', name: 'family-games' },
  { path: '/polls', name: 'polls' },
  { path: '/flashcards', name: 'flashcards' },
  { path: '/ai', name: 'ai' },
  { path: '/interview', name: 'interview' },
  { path: '/benchmark', name: 'benchmark' },
  { path: '/notebook', name: 'notebook' },
  { path: '/files', name: 'files' },
  { path: '/library', name: 'library' },
  { path: '/daily-log', name: 'daily-log' },
  { path: '/doc-scanner', name: 'doc-scanner' },
  { path: '/trips', name: 'trips' },
  { path: '/web-crawler', name: 'web-crawler' },
  { path: '/resume', name: 'resume' },
  { path: '/hiking', name: 'hiking' },
  { path: '/travel-map', name: 'travel-map' },
  { path: '/whats-new', name: 'whats-new' },
  { path: '/privacy', name: 'privacy' },
  { path: '/terms', name: 'terms' },
  { path: '/quota', name: 'quota' },
  { path: '/trash', name: 'trash' },
] as const;

/** Set up shared mocks (onboarding, data APIs) — no auth mock. */
async function setupCommonMocks(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('mycircle-onboarding-complete', 'true');
  });

  // Mock Chinese characters window bridge (not exported from fixtures)
  await page.addInitScript(() => {
    const mockChars = [
      { id: 'f01', character: '\u5988\u5988', pinyin: 'm\u0101ma', meaning: 'mom', category: 'family', createdBy: { uid: 'system', displayName: 'MyCircle' } },
      { id: 'f02', character: '\u7238\u7238', pinyin: 'b\u00e0ba', meaning: 'dad', category: 'family', createdBy: { uid: 'system', displayName: 'MyCircle' } },
      { id: 'e01', character: '\u8981', pinyin: 'y\u00e0o', meaning: 'want', category: 'feelings', createdBy: { uid: 'system', displayName: 'MyCircle' } },
      { id: 'd01', character: '\u6c34', pinyin: 'shu\u01d0', meaning: 'water', category: 'food', createdBy: { uid: 'system', displayName: 'MyCircle' } },
    ];
    const subscribers: Array<(chars: any[]) => void> = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    const mockApi = {
      getAll: () => Promise.resolve(mockChars),
      add: (char: any) => { const id = 'new-' + Date.now(); mockChars.push({ id, ...char }); subscribers.forEach(cb => cb([...mockChars])); return Promise.resolve(id); }, // eslint-disable-line @typescript-eslint/no-explicit-any
      update: (id: string, updates: any) => { const idx = mockChars.findIndex((c: any) => c.id === id); if (idx >= 0) Object.assign(mockChars[idx], updates); subscribers.forEach(cb => cb([...mockChars])); return Promise.resolve(); }, // eslint-disable-line @typescript-eslint/no-explicit-any
      delete: (id: string) => { const idx = mockChars.findIndex((c: any) => c.id === id); if (idx >= 0) mockChars.splice(idx, 1); subscribers.forEach(cb => cb([...mockChars])); return Promise.resolve(); }, // eslint-disable-line @typescript-eslint/no-explicit-any
      subscribe: (cb: (chars: any[]) => void) => { subscribers.push(cb); cb([...mockChars]); return () => { const i = subscribers.indexOf(cb); if (i >= 0) subscribers.splice(i, 1); }; }, // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    Object.defineProperty(window, '__chineseCharacters', {
      get: () => mockApi,
      set: () => {},
      configurable: true,
    });
  });

  await mockGraphQL(page);
  await mockStockAPI(page);
  await mockPodcastAPI(page);
  await mockAiChatAPI(page);
}

/** Navigate, wait for content to render, take full-page screenshot. */
async function captureScreenshot(page: Page, routePath: string, name: string, dir: string) {
  await page.goto(routePath, { waitUntil: 'load' });
  // Wait for React to render and MFE chunks to load
  await page.waitForTimeout(3000);
  // Wait for any loading spinner to disappear
  await page.locator('[role="status"]').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: `screenshots/${dir}/${name}.png`, fullPage: true });
}

// Custom test fixture: sets up data mocks but does NOT mock Firebase auth
const test = base.extend<{ commonMocks: void }>({
  commonMocks: [async ({ page }, use) => {
    await setupCommonMocks(page);
    await use();
  }, { auto: true }],
});

/* ------------------------------------------------------------------ */
/*  Unauthenticated — auth-gated pages show "Sign in required"        */
/* ------------------------------------------------------------------ */
test('unauthenticated screenshots', async ({ page }) => {
  test.setTimeout(PAGES.length * 30_000);

  // Resolve Firebase auth immediately with null user (no waiting for servers)
  await page.addInitScript(() => {
    (window as any).__e2eAuthCallback = (cb: (user: null) => void) => cb(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  for (const { path, name } of PAGES) {
    await captureScreenshot(page, path, name, 'unauthenticated');
  }
});

/* ------------------------------------------------------------------ */
/*  Authenticated — real login with email/password, then screenshot    */
/* ------------------------------------------------------------------ */
test('authenticated screenshots', async ({ page }) => {
  test.setTimeout(PAGES.length * 30_000 + 120_000);

  // Navigate to home — let real Firebase auth resolve (no __e2eAuthCallback)
  await page.goto('/', { waitUntil: 'load' });

  // Wait for the VISIBLE "Sign In" button (desktop header, not hidden mobile one)
  // Use .last() because mobile header button (.first()) has md:hidden
  const signInBtn = page.locator('button', { hasText: 'Sign In' }).last();
  await signInBtn.waitFor({ state: 'visible', timeout: 60_000 });
  await signInBtn.click();

  // Wait for auth modal to appear
  await page.getByRole('dialog').waitFor({ state: 'visible' });

  // Screenshot the login modal
  await page.screenshot({ path: 'screenshots/login.png', fullPage: true });

  // Fill credentials and submit
  await page.locator('#auth-email').fill('test@123.com');
  await page.locator('#auth-password').fill('test123');
  await page.getByRole('dialog').locator('button[type="submit"]').click();

  // Wait for modal to close (login successful)
  await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 15_000 });

  // Let auth state propagate
  await page.waitForTimeout(3000);

  for (const { path, name } of PAGES) {
    await captureScreenshot(page, path, name, 'authenticated');
  }
});
